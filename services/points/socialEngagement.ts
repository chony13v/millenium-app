import { getFunctions, httpsCallable } from "firebase/functions";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { app, db } from "@/config/FirebaseConfig";
import { type SocialPlatform } from "@/constants/social";

export type AwardSocialEngagementResponse = {
  success: boolean;
  awardedToday: boolean;
  alreadyAwarded?: boolean;
};

export const awardSocialEngagement = async (payload: {
  linkId: string;
  platform: SocialPlatform;
}): Promise<AwardSocialEngagementResponse> => {
  // Usar región explícita para evitar llamadas a funciones inexistentes por región
  const functions = getFunctions(app, "us-central1");
  const callable = httpsCallable(functions, "awardSocialEngagement");
  const result = await callable(payload);
  return result.data as AwardSocialEngagementResponse;
};

// Alias explícito para llamadas a la callable desde UI
export const callAwardSocialEngagement = awardSocialEngagement;

export const logSocialClick = async (
  userId: string | null | undefined,
  linkId: string,
  platform: SocialPlatform
) => {
  if (!userId) return;
  try {
    await addDoc(collection(db, "users", userId, "social_clicks"), {
      linkId,
      platform,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn("[social] no se pudo registrar el clic", error);
  }
};
