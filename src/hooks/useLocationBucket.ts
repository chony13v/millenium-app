import { useCallback, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import * as Location from "expo-location";

import {
  getUserTopBucket,
  persistUserLocationBucket,
  trackLocationBucketOnFieldOpen,
  type PersistedLocationResult,
  type ResolvedGeocodePlace,
  type UserLocationBucket,
} from "@/src/services/locationBucket";

export type LocationUpdateErrorCode =
  | "services-disabled"
  | "permission-denied"
  | "location-unavailable"
  | "unknown";

export interface LocationUpdateError extends Error {
  code: LocationUpdateErrorCode;
}

export interface UseLocationBucketReturn {
  topBucket: UserLocationBucket | null;
  trackOnFieldOpen: () => Promise<UserLocationBucket | null>;
  loadTopBucket: () => Promise<UserLocationBucket | null>;
  updateFromDevice: (options?: {
    source?: string;
  }) => Promise<PersistedLocationResult | null>;
}

/**
 * Hook para gestionar el bucket de ubicación aproximada (~1 km) del usuario.
 * Permite registrar visitas a la pestaña Field y recuperar la zona habitual.
 */
export const useLocationBucket = (): UseLocationBucketReturn => {
  const { user } = useUser();
  const [topBucket, setTopBucket] = useState<UserLocationBucket | null>(null);
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;
  const clerkUserId = user?.id ?? null;
  const userDocumentId = primaryEmail ?? clerkUserId ?? null;

  const buildError = useCallback(
    (code: LocationUpdateErrorCode, message: string): LocationUpdateError => {
      const error = new Error(message) as LocationUpdateError;
      error.code = code;
      return error;
    },
    []
  );

  const loadTopBucket = useCallback(async () => {
    if (!userDocumentId) {
      return null;
    }

    const bucket = await getUserTopBucket(userDocumentId);
    if (bucket) {
      setTopBucket(bucket);
      return bucket;
    }

    if (clerkUserId && clerkUserId !== userDocumentId) {
      const legacyBucket = await getUserTopBucket(clerkUserId);
      if (legacyBucket) {
        setTopBucket(legacyBucket);
        return legacyBucket;
      }
    }

    setTopBucket(null);
    return null;
  }, [userDocumentId, clerkUserId]);

  const trackOnFieldOpen = useCallback(async () => {
    if (!userDocumentId) {
      return null;
    }

    const bucket = await trackLocationBucketOnFieldOpen(userDocumentId);
    if (bucket) {
      setTopBucket(bucket);
      return bucket;
    }

    return loadTopBucket();
  }, [userDocumentId, loadTopBucket]);

  const updateFromDevice = useCallback(
    async ({ source = "manual_update" }: { source?: string } = {}) => {
      if (!userDocumentId) {
        throw buildError("unknown", "Missing user identifier");
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        throw buildError(
          "services-disabled",
          "Location services are disabled on the device"
        );
      }

      let permission = await Location.getForegroundPermissionsAsync();
      let status = permission?.status;

      if (status !== "granted") {
        permission = await Location.requestForegroundPermissionsAsync();
        status = permission.status;
      }

      if (status !== "granted") {
        throw buildError(
          "permission-denied",
          "The user did not grant location permission"
        );
      }

      let location:
        | Location.LocationObject
        | Location.LocationObjectCoords
        | null = null;

      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (error) {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          location = lastKnown;
        } else {
          throw buildError(
            "location-unavailable",
            "Unable to obtain device location"
          );
        }
      }

      if (!location) {
        throw buildError(
          "location-unavailable",
          "Unable to obtain device location"
        );
      }

      const coords =
        "coords" in location
          ? location.coords
          : (location as Location.LocationObjectCoords);

      let resolvedPlace: ResolvedGeocodePlace | null = null;

      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });

        if (place) {
          const pieces = [place.district, place.city ?? place.subregion].filter(
            Boolean
          );
          resolvedPlace = {
            neighborhood: place.district ?? place.name ?? null,
            city:
              place.city ??
              place.subregion ??
              place.region ??
              place.district ??
              null,
            region: place.region ?? place.subregion ?? null,
            country: place.country ?? null,
            isoCountryCode: place.isoCountryCode ?? null,
            formattedAddress:
              pieces.length > 0
                ? (pieces as string[]).join(", ")
                : place.name ?? null,
          };
        }
      } catch (geocodeError) {
        console.warn("Failed to reverse geocode location", geocodeError);
      }

      const result = await persistUserLocationBucket({
        userId: userDocumentId,
        coords,
        place: resolvedPlace,
        source,
      });

      if (result?.bucket) {
        setTopBucket(result.bucket);
      }

      return result;
    },
    [userDocumentId, buildError]
  );

  return {
    topBucket,
    trackOnFieldOpen,
    loadTopBucket,
    updateFromDevice,
  };
};

export default useLocationBucket;
