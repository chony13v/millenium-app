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
  where,
} from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { type PointsEventType } from "@/constants/points";
import { isSameDay } from "@/utils/date";

export type PointsProfile = {
  total: number;
  level: number;
  xpToNext: number;
  streakCount: number;
  lastEventAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  lastDailyAwardAt?: Timestamp | null;
  lastCityReportAt?: Timestamp | null;
  lastSurveyIdVoted?: string | null;
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
  lastDailyAwardAt: null,
  lastCityReportAt: null,
  lastSurveyIdVoted: null,
};

export const usePointsProfile = (
  userId?: string | null
): UsePointsProfileResult => {
  const [profile, setProfile] = useState<PointsProfile>(defaultProfile);
  const [history, setHistory] = useState<PointsLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCityReportToday, setHasCityReportToday] = useState(false);
  const [activeSurveyIds, setActiveSurveyIds] = useState<string[]>([]);

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
              lastDailyAwardAt: data.lastDailyAwardAt ?? prev.lastDailyAwardAt,
              lastCityReportAt: data.lastCityReportAt ?? prev.lastCityReportAt,
              lastSurveyIdVoted:
                data.lastSurveyIdVoted ?? prev.lastSurveyIdVoted,
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

    // social_follow once per platform
    result.social_follow =
      Object.keys(eventsByType).some((key) =>
        key.startsWith("social_follow")
      ) || (eventsByType["social_follow"] || []).length > 0
        ? "blocked"
        : "available";

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
  };
};
