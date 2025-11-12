import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Random from "expo-random";
import { useUser } from "@clerk/clerk-expo";

import {
  logLocationOptIn,
  logLocationUpdate,
  logNeighborhoodInferred,
} from "@/src/analytics";
import { inferNeighborhoodFromCoords, toBucket } from "@/src/utils/geo";
import {
  getUserLocation,
  upsertUserLocation,
  type LocationBucketDocument,
} from "@/src/services/firestore/locationRepo";
import {
  attachPushTokenToUser,
  registerForPushNotificationsAsync,
} from "@/src/services/push/RegisterPushToken";

const ANON_STORAGE_KEY = "locationAnonId";

export interface NeighborhoodSnapshot {
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
  city: doc.city,
  citySlug: doc.citySlug,
  neighborhood: doc.neighborhood,
  neighborhoodSlug: doc.neighborhoodSlug,
  latBucket: doc.latBucket,
  lonBucket: doc.lonBucket,
  accuracy: doc.accuracy,
});

const generateAnonId = async (): Promise<string> => {
  const bytes = await Random.getRandomBytesAsync(16);
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hex;
};

export const useNeighborhood = (): UseNeighborhoodState => {
  const { user } = useUser();
  const [data, setData] = useState<NeighborhoodSnapshot | null>(null);
  const [locationOptIn, setLocationOptInState] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const ensureUserId = useCallback(async (): Promise<string> => {
    if (user?.id) {
      return user.id;
    }

    const cached = await AsyncStorage.getItem(ANON_STORAGE_KEY);
    if (cached) {
      return cached;
    }

    const anonId = await generateAnonId();
    await AsyncStorage.setItem(ANON_STORAGE_KEY, anonId);
    return anonId;
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
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== Location.PermissionStatus.GRANTED) {
          setLocationOptInState(false);
          await logLocationOptIn(false);
          await upsertUserLocation(userId, {
            locationOptIn: false,
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

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const inference = await inferNeighborhoodFromCoords(
          currentLocation.coords
        );

        if (inference.neighborhood) {
          await logNeighborhoodInferred(inference.neighborhood);
        }

        const latBucket = toBucket(currentLocation.coords.latitude);
        const lonBucket = toBucket(currentLocation.coords.longitude);
        const accuracy = currentLocation.coords.accuracy ?? null;

        const expoPushToken = await registerForPushNotificationsAsync();

        await upsertUserLocation(userId, {
          locationOptIn: true,
          city: inference.city,
          citySlug: inference.citySlug,
          neighborhood: inference.neighborhood,
          neighborhoodSlug: inference.neighborhoodSlug,
          latBucket,
          lonBucket,
          accuracy,
          expoPushToken: expoPushToken ?? undefined,
        });

        if (expoPushToken) {
          await attachPushTokenToUser(userId, expoPushToken, {
            citySlug: inference.citySlug,
            neighborhoodSlug: inference.neighborhoodSlug,
          });
        }

        const snapshot: NeighborhoodSnapshot = {
          city: inference.city,
          citySlug: inference.citySlug,
          neighborhood: inference.neighborhood,
          neighborhoodSlug: inference.neighborhoodSlug,
          latBucket,
          lonBucket,
          accuracy,
        };

        setData(snapshot);
        await logLocationUpdate(
          inference.city,
          inference.neighborhood,
          accuracy
        );
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
