import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/config/FirebaseConfig";
import type { PointsEventType } from "@/constants/points";

export type AwardPointsPayload = {
  eventType: PointsEventType;
  metadata?: Record<string, unknown>;
  eventId?: string;
};

export type AwardPointsResponse = {
  success: boolean;
  total?: number;
  level?: number;
  awardedPoints?: number;
  message?: string;
};

export const awardPointsEvent = async (
  payload: AwardPointsPayload
): Promise<AwardPointsResponse> => {
  const functions = getFunctions(app);
  // Placeholder callable; implement business logic server-side to keep scoring secure.
  const callable = httpsCallable(functions, "awardPointsEvent");
  const result = await callable(payload);
  return result.data as AwardPointsResponse;
};
