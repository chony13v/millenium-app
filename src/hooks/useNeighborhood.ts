import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-expo";

import {
  logLocationOptIn,
  logLocationUpdate,
  logNeighborhoodInferred,
} from "@/src/analytics";
import {
  getUserLocation,
  upsertUserLocation,
  type LocationBucketDocument,
} from "@/src/services/firestore/locationRepo";
import {
  attachPushTokenToUser,
  registerForPushNotificationsAsync,
} from "@/src/services/push/RegisterPushToken";
import { ensureLocationUserId } from "@/src/services/location/userLocationIdentity";
import {
  ensureFreshLocationForUser,
  type ForegroundLocationSnapshot,
} from "@/src/hooks/useForegroundLocation";

export interface NeighborhoodSnapshot {
  cityId: string | null;
  city: string | null;
  citySlug: string | null;
  neighborhood: string | null;
  neighborhoodSlug: string | null;
  latBucket: number | null;
  lonBucket: number | null;
  accuracy: number | null;
}

interface UseNeighborhoodState {
  data: NeighborhoodSnapshot | null;
  locationOptIn: boolean;
  loading: boolean;
  refresh: () => Promise<NeighborhoodSnapshot | null>;
  setLocationOptIn: (value: boolean) => Promise<void>;
}

const toSnapshot = (doc: LocationBucketDocument): NeighborhoodSnapshot => ({
  cityId: doc.cityId,
  city: doc.city,
  citySlug: doc.citySlug,
  neighborhood: doc.neighborhood,
  neighborhoodSlug: doc.neighborhoodSlug,
  latBucket: doc.latBucket,
  lonBucket: doc.lonBucket,
  accuracy: doc.accuracy,
});

export const useNeighborhood = (): UseNeighborhoodState => {
  const { user } = useUser();
  const [data, setData] = useState<NeighborhoodSnapshot | null>(null);
  const [locationOptIn, setLocationOptInState] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const ensureUserId = useCallback(async (): Promise<string> => {
    return ensureLocationUserId(user?.id ?? null);
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const userId = await ensureUserId();
        const doc = await getUserLocation(userId);

        if (!isMounted || !doc) {
          return;
        }

        setLocationOptInState(Boolean(doc.locationOptIn));
        setData(doc.locationOptIn ? toSnapshot(doc) : null);
      } catch (error) {
        console.warn("Failed to load user location bucket", error);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [ensureUserId]);

  const setLocationOptInValue = useCallback(
    async (value: boolean) => {
      setLocationOptInState(value);
      await logLocationOptIn(value);

      const userId = await ensureUserId();

      if (!value) {
        setData(null);
      }

      try {
        await upsertUserLocation(userId, {
          locationOptIn: value,
          cityId: value ? undefined : null,
          city: value ? undefined : null,
          citySlug: value ? undefined : null,
          neighborhood: value ? undefined : null,
          neighborhoodSlug: value ? undefined : null,
          latBucket: value ? undefined : null,
          lonBucket: value ? undefined : null,
          accuracy: value ? undefined : null,
          expoPushToken: value ? undefined : null,
        });
      } catch (error) {
        console.warn("Failed to persist location opt-in", error);
      }
    },
    [ensureUserId]
  );

  const refresh =
    useCallback(async (): Promise<NeighborhoodSnapshot | null> => {
      if (!locationOptIn) {
        return null;
      }

      setLoading(true);

      try {
        const userId = await ensureUserId();
        const result = await ensureFreshLocationForUser({
          maxAgeMs: 0,
          getUserId: async () => userId,
        });

        if (result.status === "permission-denied") {
          setLocationOptInState(false);
          await logLocationOptIn(false);
          await upsertUserLocation(userId, {
            locationOptIn: false,
            cityId: null,
            city: null,
            citySlug: null,
            neighborhood: null,
            neighborhoodSlug: null,
            latBucket: null,
            lonBucket: null,
            accuracy: null,
            expoPushToken: null,
          });
          setData(null);
          return null;
        }

        if (result.status !== "success" || !result.location) {
          return null;
        }

        const locationSnapshot: ForegroundLocationSnapshot = result.location;

        if (locationSnapshot.neighborhood) {
          await logNeighborhoodInferred(locationSnapshot.neighborhood);
        }

        const expoPushToken = await registerForPushNotificationsAsync();

        if (expoPushToken) {
          await upsertUserLocation(userId, {
            locationOptIn: true,
            expoPushToken,
          });
          await attachPushTokenToUser(userId, expoPushToken, {
            citySlug: locationSnapshot.citySlug,
            neighborhoodSlug: locationSnapshot.neighborhoodSlug,
          });
        }

        const snapshot: NeighborhoodSnapshot = {
          cityId: locationSnapshot.cityId,
          city: locationSnapshot.city,
          citySlug: locationSnapshot.citySlug,
          neighborhood: locationSnapshot.neighborhood,
          neighborhoodSlug: locationSnapshot.neighborhoodSlug,
          latBucket: locationSnapshot.latBucket,
          lonBucket: locationSnapshot.lonBucket,
          accuracy: locationSnapshot.accuracy,
        };

        setData(snapshot);

        await logLocationUpdate({
          city: locationSnapshot.city,
          neighborhood: locationSnapshot.neighborhood,
          accuracy: locationSnapshot.accuracy,
        });
        return snapshot;
      } catch (error) {
        console.warn("Failed to refresh neighborhood", error);
        return null;
      } finally {
        setLoading(false);
      }
    }, [ensureUserId, locationOptIn]);

  return {
    data,
    locationOptIn,
    loading,
    refresh,
    setLocationOptIn: setLocationOptInValue,
  };
};

export default useNeighborhood;
