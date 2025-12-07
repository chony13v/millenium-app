import { admin, db } from "./firebase";
import { LEVEL_THRESHOLDS } from "./constants";

export type PointsProfile = {
  total?: number;
  xpToNext?: number;
  level?: number;
  streakCount?: number;
  lastDailyAwardAt?: admin.firestore.Timestamp | null;
  lastCityReportAt?: admin.firestore.Timestamp | null;
  lastEventAt?: admin.firestore.Timestamp | null;
  lastSurveyIdVoted?: string | null;
};

const PROFILE_DEFAULTS: Record<keyof PointsProfile, unknown> = {
  total: 0,
  xpToNext: 0,
  level: 1,
  streakCount: 0,
  lastDailyAwardAt: null,
  lastCityReportAt: null,
  lastEventAt: null,
  lastSurveyIdVoted: null,
};

export const getLevelProgress = (total: number) => {
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

type AwardPointsOptions = {
  userId: string;
  points: number;
  eventType: string;
  metadata?: Record<string, unknown>;
  now: admin.firestore.Timestamp;
  ledgerRef?: FirebaseFirestore.DocumentReference;
  ledgerId?: string;
  profileRef?: FirebaseFirestore.DocumentReference;
  eventId?: string;
  preserveFields?: (keyof PointsProfile)[];
  lastEventAt?: admin.firestore.Timestamp | null;
};

export const awardPointsTransaction = async (
  tx: FirebaseFirestore.Transaction,
  {
    userId,
    points,
    eventType,
    metadata = {},
    now,
    ledgerRef,
    ledgerId,
    profileRef,
    eventId,
    preserveFields = [
      "streakCount",
      "lastDailyAwardAt",
      "lastCityReportAt",
      "lastSurveyIdVoted",
    ],
    lastEventAt = now,
  }: AwardPointsOptions
) => {
  const resolvedProfileRef =
    profileRef ??
    db
      .collection("users")
      .doc(userId)
      .collection("points_profile")
      .doc("profile");
  const resolvedLedgerRef =
    ledgerRef ??
    (ledgerId
      ? db
          .collection("users")
          .doc(userId)
          .collection("points_ledger")
          .doc(ledgerId)
      : db.collection("users").doc(userId).collection("points_ledger").doc());

  const profileSnap = await tx.get(resolvedProfileRef);
  const profile = (
    profileSnap.exists ? profileSnap.data() : {}
  ) as PointsProfile;
  const newTotal = (profile.total ?? 0) + points;
  const { level, xpToNext } = getLevelProgress(newTotal);

  const baseUpdate: PointsProfile = {
    total: newTotal,
    level,
    xpToNext,
    lastEventAt: lastEventAt ?? profile.lastEventAt ?? null,
  };

  preserveFields.forEach((field) => {
    baseUpdate[field] = (profile[field] ?? PROFILE_DEFAULTS[field]) as never;
  });

  tx.set(
    resolvedProfileRef,
    {
      ...baseUpdate,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  tx.set(resolvedLedgerRef, {
    eventId: eventId ?? resolvedLedgerRef.id,
    eventType,
    points,
    createdAt: now,
    awardedBy: "cloud_function",
    metadata,
    lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    profile,
    newTotal,
    profileRef: resolvedProfileRef,
    ledgerRef: resolvedLedgerRef,
  };
};
