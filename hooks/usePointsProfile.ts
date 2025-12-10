import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  type Unsubscribe,
  where,
} from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { type PointsEventType } from "@/constants/points";
import {
  SOCIAL_PLATFORMS,
  type SocialPlatform,
} from "@/constants/social";
import { isSameDay } from "@/utils/date";
import { ensurePointsProfile } from "@/services/points/pointsProfile";
import { auth } from "@/config/FirebaseConfig";

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
  email?: string | null
): UsePointsProfileResult => {
  const authMatchesUser = !!userId && auth.currentUser?.uid === userId;
  const [profile, setProfile] = useState<PointsProfile>(defaultProfile);
  const [history, setHistory] = useState<PointsLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCityReportToday, setHasCityReportToday] = useState(false);
  const [activeSurveyIds, setActiveSurveyIds] = useState<string[]>([]);
  const [socialAvailability, setSocialAvailability] = useState<
    Record<SocialPlatform, "available" | "blocked">
  >(() =>
    SOCIAL_PLATFORMS.reduce((acc, platform) => {
      acc[platform] = "available";
      return acc;
    }, {} as Record<SocialPlatform, "available" | "blocked">)
  );
  const [loadingSocialAvailability, setLoadingSocialAvailability] =
    useState(false);

  const ensureAuthReady = useCallback(async () => {
    if (!userId || !authMatchesUser || !auth.currentUser) return false;
    try {
      await auth.currentUser.getIdToken();
      return true;
    } catch {
      setError("Sesión inválida, vuelve a iniciar sesión.");
      return false;
    }
  }, [authMatchesUser, userId]);

  const refreshFromServer = useCallback(async () => {
    if (!userId || !authMatchesUser) return;
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
  }, [userId, authMatchesUser, ensureAuthReady]);

  const refreshSocialAvailability = useCallback(async () => {
    if (!userId || !authMatchesUser) return;
    const ready = await ensureAuthReady();
    if (!ready) return;
    setLoadingSocialAvailability(true);
    const dateKey = new Date().toISOString().slice(0, 10);

    try {
      const markers = await Promise.all(
        SOCIAL_PLATFORMS.map(async (platform) => {
          const markerRef = doc(
            db,
            "users",
            userId,
            "social_meta",
            `daily_${dateKey}_${platform}`
          );
          const snap = await getDoc(markerRef);
          return { platform, awarded: snap.exists() };
        })
      );

      const base = SOCIAL_PLATFORMS.reduce(
        (acc, platform) => {
          acc[platform] = "available";
          return acc;
        },
        {} as Record<SocialPlatform, "available" | "blocked">
      );
      markers.forEach(({ platform, awarded }) => {
        base[platform] = awarded ? "blocked" : "available";
      });

      setSocialAvailability(base);
    } catch (err) {
      console.warn("[points] No se pudo leer social_meta diaria", err);
    } finally {
      setLoadingSocialAvailability(false);
    }
  }, [userId, authMatchesUser, ensureAuthReady]);

  useEffect(() => {
    if (!userId || !authMatchesUser) return;

    ensurePointsProfile(userId, email).catch((err) =>
      console.warn("No se pudo inicializar el perfil de puntos:", err)
    );
  }, [userId, email, authMatchesUser]);

  useEffect(() => {
    if (!userId || !authMatchesUser) return;
    refreshSocialAvailability();
  }, [userId, refreshSocialAvailability, authMatchesUser]);

  useEffect(() => {
    if (!userId || !authMatchesUser) {
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
  }, [userId, email, authMatchesUser]);

  const availability = useMemo(() => {
    const result: Record<string, "available" | "blocked"> = {};
    const now = new Date();

    const eventsByType = history.reduce<Record<string, Date[]>>(
      (acc, entry) => {
        if (!entry.createdAt) return acc;
        const tsDate = entry.createdAt.toDate();
        const type = entry.eventType;
        acc[type] = acc[type] || [];
        acc[type].push(tsDate);
        return acc;
      },
      {}
    );

    const hasEventToday = (type: string) =>
      (eventsByType[type] || []).some((d) => isSameDay(d, now));

    const countInLastHours = (type: string, hours: number) => {
      const since = Date.now() - hours * 60 * 60 * 1000;
      return (eventsByType[type] || []).filter((d) => d.getTime() >= since)
        .length;
    };

    // app_open_daily
    result.app_open_daily = hasEventToday("app_open_daily")
      ? "blocked"
      : "available";

    // poll_vote: disponible si existe alguna encuesta activa que el usuario no haya votado
    if (activeSurveyIds.length > 0) {
      const votedSurveyIds = new Set(
        history
          .filter(
            (entry) =>
              entry.eventType === "poll_vote" && entry.metadata?.surveyId
          )
          .map((entry) => String(entry.metadata?.surveyId))
      );
      const hasUnvoted = activeSurveyIds.some((id) => !votedSurveyIds.has(id));
      result.poll_vote = hasUnvoted ? "available" : "blocked";
    } else {
      result.poll_vote = "blocked";
    }

    // city_report_created: 1 por día, combinando reportes guardados + perfil/ledger
    const reportTodayFromProfile =
      profile.lastCityReportAt &&
      isSameDay(profile.lastCityReportAt.toDate(), now);
    const reportTodayFromHistory = (
      eventsByType["city_report_created"] || []
    ).some((d) => isSameDay(d, now));
    result.city_report_created =
      hasCityReportToday || reportTodayFromProfile || reportTodayFromHistory
        ? "blocked"
        : "available";

    // social_follow: disponible si al menos una plataforma no está premiada hoy
    const socialAnyAvailable = SOCIAL_PLATFORMS.some(
      (platform) => socialAvailability[platform] !== "blocked"
    );
    result.social_follow = socialAnyAvailable ? "available" : "blocked";

    // referral_signup always available (server valida)
    result.referral_signup = "available";

    // streak_bonus only when milestones reached; se controla server-side
    result.streak_bonus = profile.streakCount > 0 ? "available" : "blocked";

    // weekly_event_attendance: se bloquea solo si ya hubo asistencia validada hoy
    const hasWeeklyAttendanceToday = (
      eventsByType["weekly_event_attendance"] || []
    ).some((d) => isSameDay(d, now));
    result.weekly_event_attendance = hasWeeklyAttendanceToday ? "blocked" : "available";

    return result;
  }, [
    history,
    profile.streakCount,
    hasCityReportToday,
    profile.lastCityReportAt,
    activeSurveyIds,
    profile.lastSurveyIdVoted,
    socialAvailability,
  ]);

  useEffect(() => {
    if (!userId) return;

    const reportsQuery = query(
      collection(db, "cityReports"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsub = onSnapshot(
      reportsQuery,
      (snap) => {
        const today = new Date();
        const hasToday = snap.docs.some((docSnap) => {
          const data = docSnap.data() as { createdAt?: Timestamp | null };
          if (!data.createdAt) return false;
          return isSameDay(data.createdAt.toDate(), today);
        });
        setHasCityReportToday(hasToday);
      },
      () => setHasCityReportToday(false)
    );

    return () => unsub();
  }, [userId]);

  useEffect(() => {
    const q = query(collection(db, "surveys"), where("isActive", "==", true));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const ids = snap.docs.map((docSnap) => docSnap.id);
        setActiveSurveyIds(ids);
        console.log(
          "[points] activeSurvey snapshot",
          ids.length ? ids : "none"
        );
      },
      (err) => {
        console.warn("No se pudo leer encuesta activa:", err);
        setActiveSurveyIds([]);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    console.log("[points] availability ctx", {
      activeSurveyIds,
      lastSurveyIdVoted: profile.lastSurveyIdVoted,
      now: new Date().toISOString(),
    });
  }, [activeSurveyIds, profile.lastSurveyIdVoted]);

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
