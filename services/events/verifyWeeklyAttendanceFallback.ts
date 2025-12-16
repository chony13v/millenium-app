import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "@/config/FirebaseConfig";
import type { CityId } from "@/constants/cities";
import { getLevelProgress } from "@/constants/points";
import { getPointsForActivity } from "@/shared/pointsConfig";
import type { AttendanceCoords } from "./types";
import type { VerifyAttendanceResponse } from "./verifyWeeklyEventAttendance";

type VerifyWeeklyAttendanceFallbackParams = {
  attendanceId: string;
  cityId: CityId;
  coords: AttendanceCoords;
  distanceMeters?: number | null;
  eventId: string;
  userId: string;
};

const WEEKLY_EVENT_POINTS =
  getPointsForActivity("weekly_event_attendance");

export const verifyWeeklyAttendanceFallback = async ({
  attendanceId,
  cityId,
  coords,
  distanceMeters = 0,
  eventId,
  userId,
}: VerifyWeeklyAttendanceFallbackParams): Promise<VerifyAttendanceResponse> => {
  const resolvedDistance = distanceMeters ?? 0;
  const attendanceRef = doc(db, "weeklyEventAttendance", attendanceId);
  const profileRef = doc(db, "users", userId, "points_profile", "profile");
  const ledgerCollection = collection(db, "users", userId, "points_ledger");

  const existingLedgerSnap = await getDocs(
    query(
      ledgerCollection,
      where("eventType", "==", "weekly_event_attendance"),
      where("metadata.eventId", "==", eventId),
      limit(1)
    )
  );

  const now = new Date();

  const result = await runTransaction(db, async (tx) => {
    const attendanceSnap = await tx.get(attendanceRef);
    if (!attendanceSnap.exists()) {
      throw new Error("attendance_not_found");
    }

    const attendanceData = attendanceSnap.data() as {
      pointsStatus?: string | null;
    };

    if (attendanceData.pointsStatus === "awarded" || !existingLedgerSnap.empty) {
      return { verified: true, pointsAdded: 0 };
    }

    const profileSnap = await tx.get(profileRef);
    const profile = (profileSnap.exists() ? profileSnap.data() : {}) as {
      total?: number;
      level?: number;
      xpToNext?: number;
      streakCount?: number;
      lastDailyAwardAt?: Timestamp | null;
      lastCityReportAt?: Timestamp | null;
      lastSurveyIdVoted?: string | null;
    };

    const newTotal = (profile.total ?? 0) + WEEKLY_EVENT_POINTS;
    const { level, xpToNext } = getLevelProgress(newTotal);
    const streakCount = typeof profile.streakCount === "number" ? profile.streakCount : 0;
    const lastDailyAwardAt =
      profile.lastDailyAwardAt instanceof Timestamp ? profile.lastDailyAwardAt : null;
    const lastCityReportAt =
      profile.lastCityReportAt instanceof Timestamp ? profile.lastCityReportAt : null;
    const lastSurveyIdVoted =
      typeof profile.lastSurveyIdVoted === "string" ? profile.lastSurveyIdVoted : null;

    tx.set(
      profileRef,
      {
        total: newTotal,
        level,
        xpToNext,
        streakCount,
        lastDailyAwardAt,
        lastCityReportAt,
        lastSurveyIdVoted,
        lastEventAt: Timestamp.fromDate(now),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const ledgerRef = doc(ledgerCollection);
    tx.set(ledgerRef, {
      eventId,
      eventType: "weekly_event_attendance",
      points: WEEKLY_EVENT_POINTS,
      createdAt: Timestamp.fromDate(now),
      awardedBy: "app_client_fallback",
      metadata: { eventId, distanceMeters: resolvedDistance, cityId, coords },
      lastUpdatedAt: serverTimestamp(),
    });

    tx.set(
      attendanceRef,
      {
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { verified: true, pointsAdded: WEEKLY_EVENT_POINTS };
  });

  // Actualizamos el estado de asistencia fuera de la transacción para no bloquear
  // la asignación de puntos si las reglas limitan cambios en este documento.
  try {
    await setDoc(
      attendanceRef,
      {
        pointsStatus: "awarded",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (attendanceUpdateError) {
    console.warn(
      "[weekly-event] No se pudo marcar la asistencia como awarded",
      attendanceUpdateError
    );
  }

  return { ...result, distanceMeters: resolvedDistance };
};
