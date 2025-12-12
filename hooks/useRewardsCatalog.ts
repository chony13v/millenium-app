import { useCallback, useEffect, useState } from "react";

import { type Reward } from "@/types/rewards";
import { type CityId } from "@/constants/cities";
import { FALLBACK_REWARDS } from "@/constants/rewards";
import { fetchRewards } from "@/services/rewards/rewards";

type UseRewardsCatalogResult = {
  rewards: Reward[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export const useRewardsCatalog = (
  cityId?: CityId | null
): UseRewardsCatalogResult => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRewards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const list = await fetchRewards(cityId);
      setRewards(list);
    } catch (err) {
      console.warn("[rewards] Error leyendo catálogo", err);
      setError("No pudimos cargar el catálogo ahora.");
      setRewards((prev) => (prev.length ? prev : FALLBACK_REWARDS));
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  return { rewards, loading, error, refresh: loadRewards };
};
