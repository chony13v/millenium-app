import { admin, db, functions } from "./firebase";
import { EVENT_TYPE, WEEKLY_EVENT_POINTS } from "./constants";
import { haversineDistanceMeters } from "./geo";
import { awardPointsTransaction } from "./points";
import { Coords } from "./types";

export const verifyWeeklyEventAttendance = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
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

    const attendanceRef = db
      .collection("weeklyEventAttendance")
      .doc(attendanceId);
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
      return {
        verified: false,
        distanceMeters: Number.MAX_SAFE_INTEGER,
        pointsAdded: 0,
      };
    }

    if (!locationCenter || !radiusMeters) {
      await attendanceRef.set(
        {
          pointsStatus: "failed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return {
        verified: false,
        distanceMeters: Number.MAX_SAFE_INTEGER,
        pointsAdded: 0,
      };
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
      await awardPointsTransaction(tx, {
        userId,
        points: WEEKLY_EVENT_POINTS,
        eventType: EVENT_TYPE,
        metadata: { eventId, distanceMeters },
        now,
        profileRef,
        ledgerRef,
        preserveFields: [],
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
  });
