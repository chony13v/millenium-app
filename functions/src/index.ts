import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

type Coords = { latitude: number; longitude: number };

const LEVEL_THRESHOLDS = [0, 200, 500, 900, 1400, 2000];
const WEEKLY_EVENT_POINTS = 50;
const EVENT_TYPE = "weekly_event_attendance";

const getLevelProgress = (total: number) => {
  const levelIndex = LEVEL_THRESHOLDS.findIndex(
    (threshold, idx) =>
      total >= threshold &&
      (LEVEL_THRESHOLDS[idx + 1] === undefined ||
        total < LEVEL_THRESHOLDS[idx + 1])
  );

  const level = Math.max(1, levelIndex === -1 ? 1 : levelIndex + 1);
  const currentBase = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold =
    LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const range = Math.max(1, nextThreshold - currentBase);
  const progress = Math.min(1, Math.max(0, (total - currentBase) / range));
  const xpToNext = Math.max(0, nextThreshold - total);

  return { level, progress, xpToNext };
};

const haversineDistanceMeters = (from: Coords, to: Coords) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const verifyWeeklyEventAttendance = functions.https.onCall(
  async (data, context) => {
    const { attendanceId, eventId, userId, coords } = data ?? {};

    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Se requiere sesión."
      );
    }

    if (
      !attendanceId ||
      !eventId ||
      !userId ||
      !coords ||
      typeof coords.latitude !== "number" ||
      typeof coords.longitude !== "number"
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Parámetros incompletos."
      );
    }

    if (context.auth.uid !== userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "No autorizado."
      );
    }

    const attendanceRef = db.collection("weeklyEventAttendance").doc(attendanceId);
    const eventRef = db.collection("weeklyEvents").doc(eventId);
    const profileRef = db
      .collection("users")
      .doc(userId)
      .collection("points_profile")
      .doc("profile");

    const [eventSnap, attendanceSnap, existingLedgerSnap] = await Promise.all([
      eventRef.get(),
      attendanceRef.get(),
      db
        .collection("users")
        .doc(userId)
        .collection("points_ledger")
        .where("eventType", "==", EVENT_TYPE)
        .where("metadata.eventId", "==", eventId)
        .limit(1)
        .get(),
    ]);

    if (!eventSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Evento no existe.");
    }

    const eventData = eventSnap.data() as {
      active?: boolean;
      isActive?: boolean;
      radiusMeters?: number;
      locationCenter?: Coords | null;
    };

    const isActive = eventData.active ?? eventData.isActive ?? true;
    const radiusMeters = eventData.radiusMeters ?? 0;
    const locationCenter = eventData.locationCenter ?? null;

    if (!isActive) {
      await attendanceRef.set(
        {
          pointsStatus: "failed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { verified: false, distanceMeters: Number.MAX_SAFE_INTEGER, pointsAdded: 0 };
    }

    if (!locationCenter || !radiusMeters) {
      await attendanceRef.set(
        {
          pointsStatus: "failed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { verified: false, distanceMeters: Number.MAX_SAFE_INTEGER, pointsAdded: 0 };
    }

    const distanceMeters = haversineDistanceMeters(coords, locationCenter);

    if (distanceMeters > radiusMeters) {
      await attendanceRef.set(
        {
          pointsStatus: "failed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { verified: false, distanceMeters, pointsAdded: 0 };
    }

    const alreadyAwarded =
      (attendanceSnap.exists &&
        attendanceSnap.data()?.pointsStatus === "awarded") ||
      !existingLedgerSnap.empty;

    if (alreadyAwarded) {
      await attendanceRef.set(
        {
          pointsStatus: "awarded",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { verified: true, distanceMeters, pointsAdded: 0 };
    }

    const now = admin.firestore.Timestamp.now();
    const ledgerRef = db
      .collection("users")
      .doc(userId)
      .collection("points_ledger")
      .doc();

    await db.runTransaction(async (tx) => {
      const profileSnap = await tx.get(profileRef);
      const profile = (profileSnap.exists ? profileSnap.data() : {}) as {
        total?: number;
        level?: number;
        xpToNext?: number;
      };

      const newTotal = (profile.total ?? 0) + WEEKLY_EVENT_POINTS;
      const { level, xpToNext } = getLevelProgress(newTotal);

      tx.set(
        profileRef,
        {
          total: newTotal,
          level,
          xpToNext,
          lastEventAt: now,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(ledgerRef, {
        eventId,
        eventType: EVENT_TYPE,
        points: WEEKLY_EVENT_POINTS,
        createdAt: now,
        awardedBy: "cloud_function",
        metadata: { eventId, distanceMeters },
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.set(
        attendanceRef,
        {
          pointsStatus: "awarded",
          verified: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    return { verified: true, distanceMeters, pointsAdded: WEEKLY_EVENT_POINTS };
  }
);
