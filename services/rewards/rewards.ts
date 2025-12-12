import { collection, doc, getDoc, getDocs } from "firebase/firestore";

import { db } from "@/config/FirebaseConfig";
import { FALLBACK_REWARDS } from "@/constants/rewards";
import { type CityId } from "@/constants/cities";
import { type Reward } from "@/types/rewards";

const mapReward = (id: string, data: Partial<Reward>): Reward => ({
  id,
  title: data.title ?? "Recompensa",
  description: data.description ?? "Beneficio de Ciudad FC",
  cost: typeof data.cost === "number" ? data.cost : Number(data.cost ?? 0),
  merchantId: data.merchantId ?? "merchant_unknown",
  merchantName: data.merchantName ?? data.merchantId ?? "Comercio aliado",
  cityId: data.cityId ?? null,
  imageUrl: data.imageUrl ?? null,
});

export const fetchRewards = async (
  cityId?: CityId | null
): Promise<Reward[]> => {
  try {
    const snapshot = await getDocs(collection(db, "rewards"));
    const rewards: Reward[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Partial<Reward>;
      const reward = mapReward(docSnap.id, data);

      if (!cityId || !reward.cityId || reward.cityId === cityId) {
        rewards.push(reward);
      }
    });

    if (rewards.length) {
      return rewards.sort((a, b) => a.cost - b.cost);
    }
  } catch (error) {
    console.warn("[rewards] No se pudo leer catálogo", error);
  }

  return FALLBACK_REWARDS;
};

export const fetchRewardById = async (
  rewardId: string
): Promise<Reward | null> => {
  try {
    const rewardRef = doc(db, "rewards", rewardId);
    const snapshot = await getDoc(rewardRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as Partial<Reward>;
      return mapReward(snapshot.id, data);
    }
  } catch (error) {
    console.warn("[rewards] No se pudo obtener detalle", error);
  }

  return (
    FALLBACK_REWARDS.find((reward) => reward.id === rewardId) ?? null
  );
};
