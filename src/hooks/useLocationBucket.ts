import { useCallback, useState } from "react";
import { useUser } from "@clerk/clerk-expo";

import {
  getUserTopBucket,
  trackLocationBucketOnFieldOpen,
  type UserLocationBucket,
} from "@/src/services/locationBucket";

interface UseLocationBucketReturn {
  topBucket: UserLocationBucket | null;
  trackOnFieldOpen: () => Promise<UserLocationBucket | null>;
  loadTopBucket: () => Promise<UserLocationBucket | null>;
}

/**
 * Hook para gestionar el bucket de ubicación aproximada (~1 km) del usuario.
 * Permite registrar visitas a la pestaña Field y recuperar la zona habitual.
 */
export const useLocationBucket = (): UseLocationBucketReturn => {
  const { user } = useUser();
  const [topBucket, setTopBucket] = useState<UserLocationBucket | null>(null);
  const uid = user?.id;

  const loadTopBucket = useCallback(async () => {
    if (!uid) {
      return null;
    }

    const bucket = await getUserTopBucket(uid);
    setTopBucket(bucket);
    return bucket;
  }, [uid]);

  const trackOnFieldOpen = useCallback(async () => {
    if (!uid) {
      return null;
    }

    const bucket = await trackLocationBucketOnFieldOpen(uid);
    if (bucket) {
      setTopBucket(bucket);
      return bucket;
    }

    return loadTopBucket();
  }, [uid, loadTopBucket]);

  return {
    topBucket,
    trackOnFieldOpen,
    loadTopBucket,
  };
};

export default useLocationBucket;