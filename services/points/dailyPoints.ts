import { db } from "@/config/FirebaseConfig";
import {
  getLevelProgress,
  POINT_ACTIONS,
  type PointsEventType,
} from "@/constants/points";
import { getPointsForActivity } from "@/shared/pointsConfig";
import {
  collection,
  doc,
  serverTimestamp,
  Timestamp,
  type Transaction,
} from "firebase/firestore";
import { isSameDay, isYesterday } from "@/utils/date";
import { runTransactionWithRetry } from "./transactionUtils";

type PointsProfileDoc = {
  total?: number;
  level?: number;
  xpToNext?: number;
  streakCount?: number;
  lastDailyAwardAt?: Timestamp | null;
  lastEventAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  streakBonusHistory?: { awardedAt: Timestamp; points: number }[];
};

const DAILY_POINTS =
  POINT_ACTIONS.find((action) => action.eventType === "app_open_daily")
    ?.points ?? 5;
const DAILY_EVENT_TYPE: PointsEventType = "app_open_daily";

export const hasEarnedDailyToday = (
  lastDailyAwardAt?: Timestamp | null,
  now: Date = new Date()
) => {
  if (!lastDailyAwardAt) return false;
  return isSameDay(lastDailyAwardAt.toDate(), now);
};

export const getNextStreakCount = (
  lastDailyAwardAt: Date | null,
  currentStreak: number,
  now: Date = new Date()
) => {
  if (!lastDailyAwardAt) return Math.max(1, currentStreak || 0);
  if (isSameDay(lastDailyAwardAt, now)) return currentStreak;
  if (isYesterday(lastDailyAwardAt, now)) return (currentStreak || 0) + 1;
  return 1;
};

const STREAK_MILESTONES = [7, 15, 23, 30];
const MAX_STREAK_BONUS_PER_30DAYS = 100;
const STREAK_BONUS_POINTS = getPointsForActivity("streak_bonus", 25);

const pruneBonusHistory = (
  history: { awardedAt: Timestamp; points: number }[],
  now: Date
) => {
  const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  return history.filter((entry) => entry.awardedAt.toDate().getTime() >= cutoff);
};

export const registerPointsTransaction = (
  tx: Transaction,
  userId: string,
  data: {
    eventType: PointsEventType | string;
    points: number;
    eventId?: string;
    metadata?: Record<string, unknown>;
    now: Date;
  }
) => {
  const ledgerRef = doc(collection(db, "users", userId, "points_ledger"));
  tx.set(ledgerRef, {
    eventId: data.eventId ?? ledgerRef.id,
    eventType: data.eventType,
    points: data.points,
    createdAt: Timestamp.fromDate(data.now),
    awardedBy: "app_client",
    metadata: { source: data.eventType, ...(data.metadata ?? {}) },
    lastUpdatedAt: serverTimestamp(),
  });
  return ledgerRef.id;
};

export type AwardDailyResult = {
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

export const awardDailyAppOpen = async (
  userId: string,
  options?: { eventId?: string; metadata?: Record<string, unknown>; now?: Date }
): Promise<AwardDailyResult> => {
  const now = options?.now ?? new Date();
  const profileRef = doc(db, "users", userId, "points_profile", "profile");

  return runTransactionWithRetry(db, async (tx: Transaction) => {
    const snap = await tx.get(profileRef);
    const profile = (snap.exists() ? snap.data() : {}) as PointsProfileDoc;
    const lastDailyAwardAt = profile.lastDailyAwardAt ?? null;

    if (hasEarnedDailyToday(lastDailyAwardAt, now)) {
      return {
        success: false,
        alreadyAwardedToday: true,
        streakCount: profile.streakCount ?? 0,
        total: profile.total ?? 0,
        level: profile.level,
        xpToNext: profile.xpToNext,
        message: "Ya se otorgaron los puntos diarios hoy.",
      };
    }

    const nextStreak = getNextStreakCount(
      lastDailyAwardAt ? lastDailyAwardAt.toDate() : null,
      profile.streakCount ?? 0,
      now
    );

    const cleanedHistory = pruneBonusHistory(profile.streakBonusHistory ?? [], now);
    const awardedLast30 = cleanedHistory.reduce(
      (sum, entry) => sum + (entry.points || 0),
      0
    );
    let streakBonusAwarded = 0;
    let milestoneAwarded: number | null = null;

    if (
      STREAK_MILESTONES.includes(nextStreak) &&
      awardedLast30 < MAX_STREAK_BONUS_PER_30DAYS
    ) {
      const remaining = MAX_STREAK_BONUS_PER_30DAYS - awardedLast30;
      streakBonusAwarded = Math.min(STREAK_BONUS_POINTS, remaining);
      milestoneAwarded = nextStreak;
    }

    const newTotal = (profile.total ?? 0) + DAILY_POINTS + streakBonusAwarded;
    const { level, xpToNext } = getLevelProgress(newTotal);

    tx.set(
      profileRef,
      {
        total: newTotal,
        level,
        xpToNext,
        streakCount: nextStreak,
        lastDailyAwardAt: Timestamp.fromDate(now),
        lastEventAt: Timestamp.fromDate(now),
        updatedAt: serverTimestamp(),
        streakBonusHistory:
          streakBonusAwarded > 0
            ? [
                ...cleanedHistory,
                { awardedAt: Timestamp.fromDate(now), points: streakBonusAwarded },
              ]
            : cleanedHistory,
      },
      { merge: true }
    );

    const ledgerId = registerPointsTransaction(tx, userId, {
      eventType: DAILY_EVENT_TYPE,
      points: DAILY_POINTS,
      eventId: options?.eventId,
      metadata: options?.metadata,
      now,
    });

    if (streakBonusAwarded > 0) {
      registerPointsTransaction(tx, userId, {
        eventType: "streak_bonus",
        points: streakBonusAwarded,
        metadata: {
          milestone: milestoneAwarded,
          streakCount: nextStreak,
          window: "30d",
          awardedLast30,
        },
        now,
      });
    }

    return {
      success: true,
      awardedPoints: DAILY_POINTS,
      total: newTotal,
      level,
      xpToNext,
      streakCount: nextStreak,
      ledgerId,
    };
  });
};
