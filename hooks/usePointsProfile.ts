import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { getLevelProgress, type PointsEventType } from "@/constants/points";

export type PointsProfile = {
  total: number;
  level: number;
  xpToNext: number;
  streakCount: number;
  lastEventAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type PointsLedgerEntry = {
  id: string;
  eventId: string;
  eventType: PointsEventType | string;
  points: number;
  createdAt?: Timestamp | null;
  awardedBy?: string;
  metadata?: Record<string, unknown>;
};

type UsePointsProfileResult = {
  profile: PointsProfile;
  history: PointsLedgerEntry[];
  loading: boolean;
  error: string | null;
  availability: Record<string, "available" | "blocked">;
};

const defaultProfile: PointsProfile = {
  total: 0,
  level: 1,
  xpToNext: 100,
  streakCount: 0,
  lastEventAt: null,
  updatedAt: null,
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const usePointsProfile = (userId?: string | null): UsePointsProfileResult => {
  const [profile, setProfile] = useState<PointsProfile>(defaultProfile);
  const [history, setHistory] = useState<PointsLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let unsubProfile: Unsubscribe | null = null;
    let unsubHistory: Unsubscribe | null = null;

    setLoading(true);
    setError(null);

    try {
      const profileRef = doc(db, "users", userId, "points_profile", "profile");
      unsubProfile = onSnapshot(
        profileRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Partial<PointsProfile>;
            setProfile((prev) => ({
              ...prev,
              ...data,
              total: data.total ?? prev.total,
              level: data.level ?? prev.level,
              xpToNext: data.xpToNext ?? prev.xpToNext,
              streakCount: data.streakCount ?? prev.streakCount,
              lastEventAt: data.lastEventAt ?? prev.lastEventAt,
              updatedAt: data.updatedAt ?? prev.updatedAt,
            }));
          } else {
            setProfile(defaultProfile);
          }
        },
        (err) => setError(err.message)
      );

      const historyRef = query(
        collection(db, "users", userId, "points_ledger"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      unsubHistory = onSnapshot(
        historyRef,
        (snap) => {
          const items: PointsLedgerEntry[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data() as PointsLedgerEntry;
            items.push({ ...data, id: docSnap.id });
          });
          setHistory(items);
        },
        (err) => setError(err.message)
      );
    } catch (err: any) {
      setError(err?.message ?? "Error cargando puntos");
    } finally {
      setLoading(false);
    }

    return () => {
      unsubProfile?.();
      unsubHistory?.();
    };
  }, [userId]);

  const availability = useMemo(() => {
    const result: Record<string, "available" | "blocked"> = {};
    const now = new Date();

    const eventsByType = history.reduce<Record<string, Date[]>>((acc, entry) => {
      if (!entry.createdAt) return acc;
      const tsDate = entry.createdAt.toDate();
      const type = entry.eventType;
      acc[type] = acc[type] || [];
      acc[type].push(tsDate);
      return acc;
    }, {});

    const hasEventToday = (type: string) =>
      (eventsByType[type] || []).some((d) => isSameDay(d, now));

    const countInLastHours = (type: string, hours: number) => {
      const since = Date.now() - hours * 60 * 60 * 1000;
      return (eventsByType[type] || []).filter((d) => d.getTime() >= since).length;
    };

    // app_open_daily
    result.app_open_daily = hasEventToday("app_open_daily") ? "blocked" : "available";

    // poll_vote up to 3/day
    const pollsToday = (eventsByType["poll_vote"] || []).filter((d) => isSameDay(d, now)).length;
    result.poll_vote = pollsToday >= 3 ? "blocked" : "available";

    // city_report_created cooldown 6h
    result.city_report_created = countInLastHours("city_report_created", 6) > 0 ? "blocked" : "available";

    // social_follow once per platform
    result.social_follow =
      Object.keys(eventsByType).some((key) => key.startsWith("social_follow")) ||
      (eventsByType["social_follow"] || []).length > 0
        ? "blocked"
        : "available";

    // referral_signup always available (server valida)
    result.referral_signup = "available";

    // streak_bonus only when milestones reached; se controla server-side
    result.streak_bonus = profile.streakCount > 0 ? "available" : "blocked";

    return result;
  }, [history, profile.streakCount]);

  return {
    profile,
    history,
    loading,
    error,
    availability,
  };
};
