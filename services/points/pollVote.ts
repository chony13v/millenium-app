import { db } from "@/config/FirebaseConfig";
import {
  getLevelProgress,
  POINT_ACTIONS,
  type PointsEventType,
} from "@/constants/points";
import { getPointsForActivity } from "@/shared/pointsConfig";
import {
  doc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { registerPointsTransaction } from "./dailyPoints";
import { runTransactionWithRetry } from "./transactionUtils";

type PointsProfileDoc = {
  total?: number;
  level?: number;
  xpToNext?: number;
  streakCount?: number;
  lastDailyAwardAt?: Timestamp | null;
  lastEventAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  lastSurveyIdVoted?: string | null;
};

const POLL_POINTS =
  POINT_ACTIONS.find((action) => action.eventType === "poll_vote")?.points ??
  getPointsForActivity("poll_vote");
const POLL_EVENT_TYPE: PointsEventType = "poll_vote";

export type AwardPollResult = {
  success: boolean;
  awardedPoints?: number;
  total?: number;
  level?: number;
  xpToNext?: number;
  streakCount?: number;
  ledgerId?: string;
  message?: string;
};

export const awardPollVote = async (
  userId: string,
  options?: {
    surveyId?: string;
    eventId?: string;
    metadata?: Record<string, unknown>;
    now?: Date;
  }
): Promise<AwardPollResult> => {
  const now = options?.now ?? new Date();
  const profileRef = doc(db, "users", userId, "points_profile", "profile");

  return runTransactionWithRetry(db, async (tx) => {
    const snap = await tx.get(profileRef);
    const profile = (snap.exists() ? snap.data() : {}) as PointsProfileDoc;

    const newTotal = (profile.total ?? 0) + POLL_POINTS;
    const { level, xpToNext } = getLevelProgress(newTotal);

    tx.set(
      profileRef,
      {
        total: newTotal,
        level,
        xpToNext,
        streakCount: profile.streakCount ?? 0,
        lastDailyAwardAt: profile.lastDailyAwardAt ?? null,
        lastEventAt: Timestamp.fromDate(now),
        lastSurveyIdVoted:
          options?.surveyId ?? profile.lastSurveyIdVoted ?? null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const ledgerId = registerPointsTransaction(tx, userId, {
      eventType: POLL_EVENT_TYPE,
      points: POLL_POINTS,
      eventId: options?.eventId,
      metadata: { surveyId: options?.surveyId, ...(options?.metadata ?? {}) },
      now,
    });

    return {
      success: true,
      awardedPoints: POLL_POINTS,
      total: newTotal,
      level,
      xpToNext,
      streakCount: profile.streakCount ?? 0,
      ledgerId,
    };
  });
};
