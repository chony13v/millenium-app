import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocFromServer,
  onSnapshot,
  orderBy,
  query,
  limit,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db , auth } from "@/config/FirebaseConfig";
import { type PointsEventType } from "@/constants/points";
import {
  SOCIAL_PLATFORMS,
  type SocialPlatform,
} from "@/constants/social";
import { ensurePointsProfile } from "@/services/points/pointsProfile";

export type PointsProfile = {
  total: number;
  level: number;
  xpToNext: number;
  streakCount: number;
  email?: string | null;
  lastEventAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  lastDailyAwardAt?: Timestamp | null;
  lastCityReportAt?: Timestamp | null;
  lastSurveyIdVoted?: string | null;
  streakBonusHistory?: { awardedAt: Timestamp; points: number }[];
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
  socialAvailability: Record<SocialPlatform, "available" | "blocked">;
  loadingSocialAvailability: boolean;
  refreshFromServer: () => Promise<void>;
  refreshSocialAvailability: () => Promise<void>;
};

const defaultProfile: PointsProfile = {
  total: 0,
  level: 1,
  xpToNext: 100,
  streakCount: 0,
  email: null,
  lastEventAt: null,
  updatedAt: null,
  lastDailyAwardAt: null,
  lastCityReportAt: null,
  lastSurveyIdVoted: null,
};

export const usePointsProfile = (
  userId?: string | null,
  email?: string | null,
  enabled: boolean = true
): UsePointsProfileResult => {
  const authMatchesUser = !!userId && enabled && auth.currentUser?.uid === userId;
  const [profile, setProfile] = useState<PointsProfile>(defaultProfile);
  const [history, setHistory] = useState<PointsLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const createAllAvailable = useCallback(
    () =>
      SOCIAL_PLATFORMS.reduce((acc, platform) => {
        acc[platform] = "available";
        return acc;
      }, {} as Record<SocialPlatform, "available" | "blocked">),
    []
  );
  const [socialAvailability, setSocialAvailability] = useState<
    Record<SocialPlatform, "available" | "blocked">
  >(createAllAvailable);
  const [loadingSocialAvailability, setLoadingSocialAvailability] =
    useState(false);

  const ensureAuthReady = useCallback(async () => {
    if (!enabled || !userId || !authMatchesUser || !auth.currentUser) return false;
    try {
      await auth.currentUser.getIdToken();
      return true;
    } catch {
      setError("Sesión inválida, vuelve a iniciar sesión.");
      return false;
    }
  }, [authMatchesUser, enabled, userId]);

  const refreshFromServer = useCallback(async () => {
    if (!enabled || !userId || !authMatchesUser) return;
    const ready = await ensureAuthReady();
    if (!ready) return;
    try {
      const profileRef = doc(db, "users", userId, "points_profile", "profile");
      const snap = await getDocFromServer(profileRef);
      if (snap.exists()) {
        const data = snap.data() as Partial<PointsProfile>;
        setProfile((prev) => ({
          ...prev,
          ...data,
          total: data.total ?? prev.total,
          level: data.level ?? prev.level,
          xpToNext: data.xpToNext ?? prev.xpToNext,
          streakCount: data.streakCount ?? prev.streakCount,
          email: data.email ?? prev.email ?? null,
          lastEventAt: data.lastEventAt ?? prev.lastEventAt,
          lastDailyAwardAt: data.lastDailyAwardAt ?? prev.lastDailyAwardAt,
          lastCityReportAt: data.lastCityReportAt ?? prev.lastCityReportAt,
          lastSurveyIdVoted: data.lastSurveyIdVoted ?? prev.lastSurveyIdVoted,
          updatedAt: data.updatedAt ?? prev.updatedAt,
        }));
      }
    } catch (err: any) {
      setError(err?.message ?? "No se pudo refrescar el perfil de puntos");
    }
  }, [userId, authMatchesUser, ensureAuthReady, enabled]);

  const refreshSocialAvailability = useCallback(async () => {
    setSocialAvailability(createAllAvailable());
    setLoadingSocialAvailability(false);
  }, [createAllAvailable]);

  useEffect(() => {
    if (!enabled || !userId || !authMatchesUser) return;

    ensurePointsProfile(userId, email).catch((err) =>
      console.warn("No se pudo inicializar el perfil de puntos:", err)
    );
  }, [userId, email, authMatchesUser, enabled]);

  useEffect(() => {
    if (!enabled || !userId || !authMatchesUser) return;
    refreshSocialAvailability();
  }, [userId, refreshSocialAvailability, authMatchesUser, enabled]);

  useEffect(() => {
    if (!enabled || !userId || !authMatchesUser) {
      setLoading(false);
      return;
    }

    ensureAuthReady().then((ready) => {
      if (!ready) setLoading(false);
    });

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
              email: data.email ?? prev.email ?? null,
              lastEventAt: data.lastEventAt ?? prev.lastEventAt,
              lastDailyAwardAt: data.lastDailyAwardAt ?? prev.lastDailyAwardAt,
              lastCityReportAt: data.lastCityReportAt ?? prev.lastCityReportAt,
              lastSurveyIdVoted:
                data.lastSurveyIdVoted ?? prev.lastSurveyIdVoted,
              updatedAt: data.updatedAt ?? prev.updatedAt,
            }));
          } else {
            setProfile((prev) => ({
              ...defaultProfile,
              email: email ?? prev.email ?? null,
            }));
          }
        },
        (err) => setError(err.message)
      );

      const historyRef = query(
        collection(db, "users", userId, "points_ledger"),
        orderBy("createdAt", "desc"),
        limit(100)
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
  }, [userId, email, authMatchesUser, ensureAuthReady, enabled]);

  const availability = useMemo(() => {
    return {
      app_open_daily: "available",
      poll_vote: "available",
      city_report_created: "available",
      social_follow: "available",
      referral_signup: "available",
      streak_bonus: "available",
      weekly_event_attendance: "available",
    };
  }, []);

  return {
    profile,
    history,
    loading,
    error,
    availability,
    socialAvailability,
    loadingSocialAvailability,
    refreshFromServer,
    refreshSocialAvailability,
  };
};
