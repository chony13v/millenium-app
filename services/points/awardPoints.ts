import { getFunctions, httpsCallable } from "firebase/functions";
import { app, auth } from "@/config/FirebaseConfig";
import type { PointsEventType } from "@/constants/points";
import { awardDailyAppOpen } from "./dailyPoints";
import { awardPollVote } from "./pollVote";
import { awardCityReport } from "./cityReport";

export type AwardPointsPayload = {
  eventType: PointsEventType;
  userId?: string;
  metadata?: Record<string, unknown>;
  eventId?: string;
};

export type AwardPointsResponse = {
  success: boolean;
  total?: number;
  level?: number;
  streakCount?: number;
  awardedPoints?: number;
  alreadyAwardedToday?: boolean;
  message?: string;
};

export const awardPointsEvent = async (
  payload: AwardPointsPayload
): Promise<AwardPointsResponse> => {
  const currentUid = auth.currentUser?.uid ?? null;
  const resolvedUserId = payload.userId ?? currentUid;

  if (!resolvedUserId || !currentUid) {
    return {
      success: false,
      message: "Inicia sesión para otorgar puntos.",
    };
  }

  if (auth.currentUser && auth.currentUser.uid !== resolvedUserId) {
    return {
      success: false,
      message: "La sesión no coincide con el usuario. Inicia sesión nuevamente.",
    };
  }

  // Fuerza token fresco antes de tocar Firestore/Functions para evitar permisos inválidos
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        message: "No se pudo validar la sesión. Intenta iniciar sesión otra vez.",
      };
    }
    await auth.currentUser.getIdToken(true);
  } catch (err) {
    return {
      success: false,
      message: "No se pudo validar la sesión. Intenta iniciar sesión otra vez.",
    };
  }

  if (payload.eventType === "app_open_daily") {
    if (!resolvedUserId) {
      return {
        success: false,
        message: "userId es obligatorio para otorgar puntos diarios.",
      };
    }

    return awardDailyAppOpen(resolvedUserId, {
      eventId: payload.eventId,
      metadata: payload.metadata,
    });
  }

  if (payload.eventType === "poll_vote") {
    if (!resolvedUserId) {
      return {
        success: false,
        message: "userId es obligatorio para otorgar puntos por encuesta.",
      };
    }

    return awardPollVote(resolvedUserId, {
      eventId: payload.eventId,
      metadata: payload.metadata,
      surveyId: (payload.metadata?.surveyId as string | undefined) ?? undefined,
    });
  }

  if (payload.eventType === "city_report_created") {
    if (!resolvedUserId) {
      return {
        success: false,
        message: "userId es obligatorio para otorgar puntos por reporte.",
      };
    }

    return awardCityReport(resolvedUserId, {
      eventId: payload.eventId,
      metadata: payload.metadata,
    });
  }

  const functions = getFunctions(app);
  // Placeholder callable; implement business logic server-side to keep scoring secure.
  const callable = httpsCallable(functions, "awardPointsEvent");
  const result = await callable(payload);
  return result.data as AwardPointsResponse;
};
