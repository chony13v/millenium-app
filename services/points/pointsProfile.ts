import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";

export type PointsProfileDoc = {
  total: number;
  level: number;
  xpToNext: number;
  streakCount: number;
  email?: string | null;
  lastEventAt?: Timestamp | null;
  lastDailyAwardAt?: Timestamp | null;
  lastCityReportAt?: Timestamp | null;
  lastSurveyIdVoted?: string | null;
  streakBonusHistory?: { awardedAt: Timestamp; points: number }[];
  updatedAt?: Timestamp | ReturnType<typeof serverTimestamp> | null;
};

/**
 * Ensures a points profile exists for the given user.
 * - Creates it with default values if missing.
 * - Syncs the email when provided or changed.
 */
export const ensurePointsProfile = async (
  userId: string,
  email?: string | null
): Promise<PointsProfileDoc | null> => {
  if (!userId) return null;

  const profileRef = doc(db, "users", userId, "points_profile", "profile");
  const existingSnap = await getDoc(profileRef);

  if (existingSnap.exists()) {
    const data = existingSnap.data() as PointsProfileDoc;
    const shouldUpdateEmail =
      email !== undefined && data.email !== email;

    if (shouldUpdateEmail) {
      await setDoc(
        profileRef,
        { email: email ?? null, updatedAt: serverTimestamp() },
        { merge: true }
      );
    }

    return { ...data, email: shouldUpdateEmail ? email ?? null : data.email };
  }

  const initialProfile: PointsProfileDoc = {
    total: 0,
    level: 1,
    xpToNext: 100,
    streakCount: 0,
    email: email ?? null,
    lastDailyAwardAt: null,
    lastCityReportAt: null,
    lastEventAt: null,
    lastSurveyIdVoted: null,
    streakBonusHistory: [],
    updatedAt: serverTimestamp(),
  };

  await setDoc(profileRef, initialProfile);
  return initialProfile;
};
