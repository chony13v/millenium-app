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
  updateFromDevice: () => Promise<PersistedLocationResult | null>;
}

/**
 * Hook para gestionar el bucket de ubicación aproximada (~1 km) del usuario.
 * Permite registrar visitas a la pestaña Field y recuperar la zona habitual.
 */
export const useLocationBucket = (): UseLocationBucketReturn => {
  const { user } = useUser();
  const [topBucket, setTopBucket] = useState<UserLocationBucket | null>(null);
  const uid = user?.id;

  const buildError = useCallback(
    (code: LocationUpdateErrorCode, message: string): LocationUpdateError => {
      const error = new Error(message) as LocationUpdateError;
      error.code = code;
      return error;
    },
    []
  );

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

  const updateFromDevice = useCallback(async () => {
    if (!uid) {
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
      uid,
      coords,
      place: resolvedPlace,
      source: "manual_update",
    });

    if (result?.bucket) {
      setTopBucket(result.bucket);
    }

    return result;
  }, [uid, buildError]);

  return {
    topBucket,
    trackOnFieldOpen,
    loadTopBucket,
    updateFromDevice,
  };
};

export default useLocationBucket;
