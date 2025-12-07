import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/config/FirebaseConfig";

export type AwardNewsClickResponse = {
  success: boolean;
  alreadyAwarded: boolean;
  points: number;
  newsId?: string;
  title?: string | null;
};

export const awardNewsClick = async (
  newsId: string
): Promise<AwardNewsClickResponse> => {
  const functions = getFunctions(app, "us-central1");
  const callable = httpsCallable(functions, "awardNewsClick");
  const result = await callable({ newsId });
  return result.data as AwardNewsClickResponse;
};
