import { getFunctions, httpsCallable } from "firebase/functions";

import { app } from "@/config/FirebaseConfig";
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
