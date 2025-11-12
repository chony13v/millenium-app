import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { getAuth } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

import {
  getUserLocation,
  upsertUserLocation,
  type LocationBucketDocument,
} from "@/src/services/firestore/locationRepo";
import { inferNeighborhoodFromCoords, toBucket } from "@/src/utils/geo";

const TASK_NAME = "bg-location-weekly";
const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;
const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

const toDate = (value: LocationBucketDocument["updatedAt"]): Date | null => {
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

const ensureTaskDefined = () => {
  if ((TaskManager as { isTaskDefined?: (taskName: string) => boolean }).isTaskDefined?.(TASK_NAME)) {
    return;
  }

  TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.warn("bg-location-weekly task error", error);
      return;
    }

    const locations = (data as { locations?: Location.LocationObject[] })?.locations;

    if (!locations?.length) {
      return;
    }

    const latestLocation = locations[locations.length - 1];

    if (!latestLocation?.coords) {
      return;
    }

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser?.uid) {
      return;
    }

    try {
      const doc = await getUserLocation(currentUser.uid);

      if (!doc?.locationOptIn) {
        return;
      }

      const lastUpdatedAt = toDate(doc.updatedAt);

      if (lastUpdatedAt && Date.now() - lastUpdatedAt.getTime() < SEVEN_DAYS_IN_MS) {
        return;
      }

      const inference = await inferNeighborhoodFromCoords(latestLocation.coords);
      const latBucket = toBucket(latestLocation.coords.latitude);
      const lonBucket = toBucket(latestLocation.coords.longitude);
      const accuracy = latestLocation.coords.accuracy ?? null;

      await upsertUserLocation(currentUser.uid, {
        locationOptIn: true,
        city: inference.city,
        citySlug: inference.citySlug,
        neighborhood: inference.neighborhood,
        neighborhoodSlug: inference.neighborhoodSlug,
        latBucket,
        lonBucket,
        accuracy,
      });
    } catch (taskError) {
      console.warn("bg-location-weekly task handler failed", taskError);
    }
  });
};

ensureTaskDefined();

export const startBgLocation = async (): Promise<boolean> => {
  ensureTaskDefined();

  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser?.uid) {
    console.warn("startBgLocation: no authenticated Firebase user");
    return false;
  }

  try {
    const doc = await getUserLocation(currentUser.uid);

    if (doc && !doc.locationOptIn) {
      console.warn("startBgLocation: locationOptIn disabled in Firestore");
      return false;
    }

    const foregroundPermission = await Location.requestForegroundPermissionsAsync();

    if (foregroundPermission.status !== Location.PermissionStatus.GRANTED) {
      console.warn("startBgLocation: foreground permission not granted");
      return false;
    }

    const backgroundPermission = await Location.requestBackgroundPermissionsAsync();

    if (backgroundPermission.status !== Location.PermissionStatus.GRANTED) {
      console.warn("startBgLocation: background permission not granted");
      return false;
    }

    const hasStarted = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);

    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(TASK_NAME);
    }

    await Location.startLocationUpdatesAsync(TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: SIX_HOURS_IN_MS,
      distanceInterval: 500,
      pausesUpdatesAutomatically: true,
      showsBackgroundLocationIndicator: false,
      foregroundService: {
        notificationTitle: "Actualizamos tu ubicación",
        notificationBody: "Millenium FC mantiene tu ubicación aproximada al día.",
      },
    });

    return true;
  } catch (error) {
    console.warn("startBgLocation failed", error);
    return false;
  }
};

export const stopBgLocation = async (): Promise<void> => {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);

    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(TASK_NAME);
    }
  } catch (error) {
    console.warn("stopBgLocation failed", error);
  }
};

export const BG_LOCATION_TASK_NAME = TASK_NAME;
