import { useCallback, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { Timestamp } from "firebase/firestore";

import { logLocationDenied, logLocationUpdate } from "@/src/analytics";
import {
  getUserLocation,
  upsertUserLocation,
  type LocationBucketDocument,
} from "@/src/services/firestore/locationRepo";
import { ensureLocationUserId } from "@/src/services/location/userLocationIdentity";
import { inferNeighborhoodFromCoords, toBucket } from "@/src/utils/geo";

const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

const toDate = (value?: LocationBucketDocument["updatedAt"]): Date | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  return null;
};

export interface ForegroundLocationSnapshot {
  userId: string;
  coords: Location.LocationObjectCoords;
  cityId: string | null;
  city: string | null;
  citySlug: string | null;
  neighborhood: string | null;
  neighborhoodSlug: string | null;
  latBucket: number;
  lonBucket: number;
  accuracy: number | null;
  updatedAt: number;
}

export type EnsureFreshLocationStatus =
  | "success"
  | "permission-denied"
  | "services-disabled"
  | "missing-user"
  | "opted-out"
  | "error";

export interface EnsureFreshLocationOptions {
  maxAgeMs?: number;
}

interface EnsureFreshLocationInternalOptions
  extends EnsureFreshLocationOptions {
  getUserId: () => Promise<string | null>;
}

export interface EnsureFreshLocationResult {
  status: EnsureFreshLocationStatus;
  permissionStatus: Location.PermissionStatus;
  servicesEnabled: boolean;
  locationOptIn: boolean;
  location?: ForegroundLocationSnapshot;
  error?: Error;
}

export const ensureFreshLocationForUser = async ({
  maxAgeMs = SIX_HOURS_IN_MS,
  getUserId,
}: EnsureFreshLocationInternalOptions): Promise<EnsureFreshLocationResult> => {
  let permissionStatus: Location.PermissionStatus =
    Location.PermissionStatus.UNDETERMINED;
  let servicesEnabled = false;
  let locationOptIn = false;

  try {
    const userId = await getUserId();

    if (!userId) {
      return {
        status: "missing-user",
        permissionStatus,
        servicesEnabled,
        locationOptIn,
      };
    }

    const existingDoc = await getUserLocation(userId);
    locationOptIn = Boolean(existingDoc?.locationOptIn);

    servicesEnabled = await Location.hasServicesEnabledAsync();
    let permission = await Location.getForegroundPermissionsAsync();
    permissionStatus = permission.status;

    if (!servicesEnabled) {
      await logLocationDenied();
      return {
        status: "services-disabled",
        permissionStatus,
        servicesEnabled,
        locationOptIn,
      };
    }

    if (
      permissionStatus === Location.PermissionStatus.UNDETERMINED &&
      (existingDoc?.locationOptIn ?? true)
    ) {
      permission = await Location.requestForegroundPermissionsAsync();
      permissionStatus = permission.status;
    }

    if (permissionStatus !== Location.PermissionStatus.GRANTED) {
      await logLocationDenied();
      return {
        status: "permission-denied",
        permissionStatus,
        servicesEnabled,
        locationOptIn,
      };
    }

    if (existingDoc?.locationOptIn === false) {
      return {
        status: "opted-out",
        permissionStatus,
        servicesEnabled,
        locationOptIn: false,
      };
    }

    const now = Date.now();
    const lastUpdatedAt = toDate(existingDoc?.updatedAt)?.getTime() ?? null;

    let location = await Location.getLastKnownPositionAsync();
    if (
      !location ||
      typeof location.timestamp !== "number" ||
      now - location.timestamp > maxAgeMs
    ) {
      location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    }

    if (!location) {
      throw new Error(
        "No se pudo obtener la ubicación actual del dispositivo."
      );
    }

    const coords =
      "coords" in location
        ? location.coords
        : (location as Location.LocationObjectCoords);
    const coordsSnapshot: Location.LocationObjectCoords = { ...coords };
    const accuracy = coordsSnapshot.accuracy ?? null;

    const inference = await inferNeighborhoodFromCoords(coordsSnapshot);
    const latBucket = toBucket(coordsSnapshot.latitude);
    const lonBucket = toBucket(coordsSnapshot.longitude);

    const shouldPersist =
      !existingDoc ||
      !existingDoc.locationOptIn ||
      existingDoc.latBucket !== latBucket ||
      existingDoc.lonBucket !== lonBucket ||
      existingDoc.citySlug !== inference.citySlug ||
      existingDoc.neighborhoodSlug !== inference.neighborhoodSlug ||
      lastUpdatedAt === null ||
      now - lastUpdatedAt > maxAgeMs;

    if (shouldPersist) {
      await upsertUserLocation(userId, {
        locationOptIn: true,
        cityId: inference.cityId,
        city: inference.city,
        citySlug: inference.citySlug,
        neighborhood: inference.neighborhood,
        neighborhoodSlug: inference.neighborhoodSlug,
        latBucket,
        lonBucket,
        accuracy,
      });

      await logLocationUpdate({
        city: inference.city,
        neighborhood: inference.neighborhood,
        accuracy,
      });
    }

    const snapshot: ForegroundLocationSnapshot = {
      userId,
      coords: coordsSnapshot,
      cityId: inference.cityId,
      city: inference.city,
      citySlug: inference.citySlug,
      neighborhood: inference.neighborhood,
      neighborhoodSlug: inference.neighborhoodSlug,
      latBucket,
      lonBucket,
      accuracy,
      updatedAt: now,
    };

    return {
      status: "success",
      permissionStatus,
      servicesEnabled: true,
      locationOptIn: true,
      location: snapshot,
    };
  } catch (rawError) {
    const error =
      rawError instanceof Error ? rawError : new Error(String(rawError));
    await logLocationDenied();
    return {
      status: "error",
      permissionStatus,
      servicesEnabled,
      locationOptIn,
      error,
    };
  }
};

export interface UseForegroundLocationReturn {
  ensureFreshLocation: (
    options?: EnsureFreshLocationOptions
  ) => Promise<EnsureFreshLocationResult>;
  lastKnownLocation: ForegroundLocationSnapshot | null;
  permissionStatus: Location.PermissionStatus | null;
  servicesEnabled: boolean | null;
  locationOptIn: boolean | null;
  isEnsuring: boolean;
  lastError: Error | null;
}

export const useForegroundLocation = (): UseForegroundLocationReturn => {
  const { user } = useUser();
  const [lastKnownLocation, setLastKnownLocation] =
    useState<ForegroundLocationSnapshot | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);
  const [servicesEnabled, setServicesEnabled] = useState<boolean | null>(null);
  const [locationOptIn, setLocationOptIn] = useState<boolean | null>(null);
  const [isEnsuring, setIsEnsuring] = useState(false);
  const lastErrorRef = useRef<Error | null>(null);

  const ensureFreshLocation = useCallback(
    async (options?: EnsureFreshLocationOptions) => {
      setIsEnsuring(true);
      try {
        const result = await ensureFreshLocationForUser({
          ...options,
          getUserId: () => ensureLocationUserId(user?.id ?? null),
        });

        setPermissionStatus(result.permissionStatus);
        setServicesEnabled(result.servicesEnabled);
        setLocationOptIn(result.locationOptIn);
        lastErrorRef.current = result.error ?? null;

        if (result.status === "success" && result.location) {
          setLastKnownLocation(result.location);
        } else if (result.status !== "success") {
          setLastKnownLocation((current) =>
            result.locationOptIn ? current : null
          );
        }

        return result;
      } finally {
        setIsEnsuring(false);
      }
    },
    [user?.id]
  );

  return {
    ensureFreshLocation,
    lastKnownLocation,
    permissionStatus,
    servicesEnabled,
    locationOptIn,
    isEnsuring,
    lastError: lastErrorRef.current,
  };
};

export default useForegroundLocation;
