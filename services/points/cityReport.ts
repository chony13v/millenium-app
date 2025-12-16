import { db } from "@/config/FirebaseConfig";
import {
  getLevelProgress,
  POINT_ACTIONS,
  type PointsEventType,
} from "@/constants/points";
import {
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type Transaction,
} from "firebase/firestore";
import { registerPointsTransaction } from "./dailyPoints";
import { isSameDay } from "@/utils/date";
import { getPointsForActivity } from "@/shared/pointsConfig";

const CITY_REPORT_EVENT: PointsEventType = "city_report_created";
const CITY_REPORT_POINTS =
  POINT_ACTIONS.find((a) => a.eventType === CITY_REPORT_EVENT)?.points ??
  getPointsForActivity(CITY_REPORT_EVENT, 30);

type PointsProfileDoc = {
  total?: number;
  level?: number;
  xpToNext?: number;
  streakCount?: number;
  lastDailyAwardAt?: Timestamp | null;
  lastEventAt?: Timestamp | null;
  lastCityReportAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type AwardCityReportResult = {
  success: boolean;
  awardedPoints?: number;
  total?: number;
  level?: number;
  xpToNext?: number;
  streakCount?: number;
  ledgerId?: string;
  alreadyAwardedToday?: boolean;
  message?: string;
};

export const awardCityReport = async (
  userId: string,
  options?: { eventId?: string; metadata?: Record<string, unknown>; now?: Date }
): Promise<AwardCityReportResult> => {
  const now = options?.now ?? new Date();
  const profileRef = doc(db, "users", userId, "points_profile", "profile");

  return runTransaction(db, async (tx: Transaction) => {
    const snap = await tx.get(profileRef);
    const profile = (snap.exists() ? snap.data() : {}) as PointsProfileDoc;
    const lastCityReportAt = profile.lastCityReportAt ?? null;

    if (lastCityReportAt && isSameDay(lastCityReportAt.toDate(), now)) {
      return {
        success: false,
        alreadyAwardedToday: true,
        total: profile.total ?? 0,
        level: profile.level,
        xpToNext: profile.xpToNext,
        streakCount: profile.streakCount ?? 0,
        message: "Ya se otorgaron puntos por un reporte hoy.",
      };
    }

    const newTotal = (profile.total ?? 0) + CITY_REPORT_POINTS;
    const { level, xpToNext } = getLevelProgress(newTotal);

    tx.set(
      profileRef,
      {
        total: newTotal,
        level,
        xpToNext,
        streakCount: profile.streakCount ?? 0,
        lastDailyAwardAt: profile.lastDailyAwardAt ?? null,
        lastCityReportAt: Timestamp.fromDate(now),
        lastEventAt: Timestamp.fromDate(now),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const ledgerId = registerPointsTransaction(tx, userId, {
      eventType: CITY_REPORT_EVENT,
      points: CITY_REPORT_POINTS,
      eventId: options?.eventId,
      metadata: options?.metadata,
      now,
    });

    return {
      success: true,
      awardedPoints: CITY_REPORT_POINTS,
      total: newTotal,
      level,
      xpToNext,
      streakCount: profile.streakCount ?? 0,
      ledgerId,
    };
  });
};
