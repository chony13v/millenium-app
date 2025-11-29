import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/config/FirebaseConfig";
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
  if (payload.eventType === "app_open_daily") {
    if (!payload.userId) {
      return {
        success: false,
        message: "userId es obligatorio para otorgar puntos diarios.",
      };
    }

    return awardDailyAppOpen(payload.userId, {
      eventId: payload.eventId,
      metadata: payload.metadata,
    });
  }

  if (payload.eventType === "poll_vote") {
    if (!payload.userId) {
      return {
        success: false,
        message: "userId es obligatorio para otorgar puntos por encuesta.",
      };
    }

    return awardPollVote(payload.userId, {
      eventId: payload.eventId,
      metadata: payload.metadata,
      surveyId: (payload.metadata?.surveyId as string | undefined) ?? undefined,
    });
  }

  if (payload.eventType === "city_report_created") {
    if (!payload.userId) {
      return {
        success: false,
        message: "userId es obligatorio para otorgar puntos por reporte.",
      };
    }

    return awardCityReport(payload.userId, {
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
