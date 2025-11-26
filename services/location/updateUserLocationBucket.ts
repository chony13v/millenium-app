import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { logEvent } from "firebase/analytics";
import * as Location from "expo-location";
import { db, analytics } from "@/config/FirebaseConfig";
import type { CityId } from "@/constants/cities";
import { enrichLocationEvent } from "./enrichLocationEvent";
import { updateCellDailyForEvent } from "@/services/location/cellsDaily";

const BUCKET_SIZE = 0.02; // ~2 km grid depending on latitude

type UpdateUserLocationBucketParams = {
  userId: string;
  cityId: CityId | null;

};

type UpdateUserLocationBucketResult = {
  bucketId: string;
  coords: Location.LocationObjectCoords;
};

const logAnalytics = (eventName: string, params: Record<string, unknown>) => {
  if (!analytics) {
    return;
  }

  try {
    logEvent(analytics, eventName, params);
  } catch (error) {
    console.warn("No se pudo enviar el evento de analytics", error);
  }
};

const deriveBucketId = (coords: Location.LocationObjectCoords) => {
  const latBucket = Math.round(coords.latitude / BUCKET_SIZE) * BUCKET_SIZE;
  const lngBucket = Math.round(coords.longitude / BUCKET_SIZE) * BUCKET_SIZE;
  return `${latBucket.toFixed(4)}_${lngBucket.toFixed(4)}`;
};

export const updateUserLocationBucket = async ({
  userId,

  cityId,
}: UpdateUserLocationBucketParams): Promise<UpdateUserLocationBucketResult> => {
  const servicesEnabled = await Location.hasServicesEnabledAsync();

  if (!servicesEnabled) {
    logAnalytics("location_update_cancelled", {
      reason: "services_disabled",
    });
    throw new Error("Los servicios de ubicación están desactivados.");
  }

  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    logAnalytics("location_update_cancelled", {
      reason: "permission_denied",
    });
    throw new Error("Permiso de ubicación denegado.");
  }

  let position: Location.LocationObject;

  try {
    position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
  } catch (error) {
    logAnalytics("location_update_cancelled", {
      reason: "position_unavailable",
    });
    throw error;
  }

  const bucketId = deriveBucketId(position.coords);

  const enrichedEvent = enrichLocationEvent({
    userId,
    cityId,
    bucketId,
    coords: position.coords,
    consentGiven: true,
    permissionStatus: status,
    eventType: "manual_update",
    locationMethod: position?.mocked ? "unknown" : "fused",
    timestamp: position.timestamp ?? Date.now(),
  });

  if (!enrichedEvent) {
    throw new Error(
      "El evento de ubicación no cumple los requisitos para guardarse."
    );
  }


  await addDoc(collection(db, "locationEvents"), {
    ...enrichedEvent,
    createdAt: serverTimestamp(),
  });



  await addDoc(collection(db, "locationBuckets"), {
    ...enrichedEvent,
    createdAt: serverTimestamp(),
  });

  logAnalytics("location_update_ok", {
    bucketId,
    cityId: cityId ?? "unknown",
    accuracy: position.coords.accuracy ?? 0,
  });

  return { bucketId, coords: position.coords };
};
