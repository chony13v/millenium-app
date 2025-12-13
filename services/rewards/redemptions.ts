import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

import { app, db } from "@/config/FirebaseConfig";
import { type Redemption } from "@/types/rewards";

export const buildRedemptionQrUrl = (redemptionId: string) =>
  `https://milleniumfc.com/canje?id=${encodeURIComponent(redemptionId)}`;

type CreateRedemptionInput = {
  rewardId: string;
  merchantId: string;
  cityId?: string | null;
  rewardCost?: number;
  rewardTitle?: string;
};

export const createRedemption = async ({
  rewardId,
  merchantId,
  cityId,
  rewardCost,
  rewardTitle,
}: CreateRedemptionInput): Promise<Redemption & { newTotal?: number }> => {
  const functions = getFunctions(app, "us-central1");
  const callable = httpsCallable(functions, "createRedemptionWithPoints");
  const result = await callable({
    rewardId,
    merchantId,
    cityId: cityId ?? null,
    rewardCost,
    rewardTitle,
  });

  const data = result.data as {
    redemptionId: string;
    qrUrl: string;
    status: string;
    newTotal?: number;
    userId?: string;
    rewardId: string;
    merchantId: string;
  };

  return {
    id: data.redemptionId,
    userId: data.userId ?? "",
    rewardId: data.rewardId,
    merchantId: data.merchantId,
    status: data.status as Redemption["status"],
    createdAt: null,
    expiresAt: null,
    qrUrl: data.qrUrl,
    cityId: cityId ?? null,
    appVersion: null,
    newTotal: data.newTotal,
  };
};

export const fetchLatestRedemptionForReward = async (
  userId: string,
  rewardId: string
): Promise<Redemption | null> => {
  try {
    const redemptionsRef = collection(db, "redemptions");
    const q = query(
      redemptionsRef,
      where("userId", "==", userId),
      where("rewardId", "==", rewardId),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as Partial<Redemption>;

    return {
      id: docSnap.id,
      userId: data.userId ?? userId,
      rewardId: data.rewardId ?? rewardId,
      merchantId: data.merchantId ?? "",
      status: (data.status as Redemption["status"]) ?? "pending",
      createdAt: data.createdAt ?? null,
      expiresAt: data.expiresAt ?? null,
      qrUrl: data.qrUrl ?? buildRedemptionQrUrl(docSnap.id),
      cityId: data.cityId ?? null,
      appVersion: data.appVersion ?? null,
    };
  } catch (error) {
    console.warn("[rewards] No se pudo leer el último canje", error);
    return null;
  }
};
