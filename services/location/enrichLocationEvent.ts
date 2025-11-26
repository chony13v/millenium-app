import { Platform } from "react-native";
import Constants from "expo-constants";
import type * as Location from "expo-location";
import { toGeohash } from "@/utils/geo";
import type { CityId } from "@/constants/cities";

const isValidCoordinate = (value: number, min: number, max: number) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;

export type RawLocationEvent = {
  userId: string;
  userEmail?: string | null;
  cityId: CityId | null;
  bucketId: string;
  coords: Location.LocationObjectCoords;
};

export type EnrichedLocationEvent = {
  userId: string;
  userEmail?: string | null;
  bucketId: string;
  cityId: CityId | null;
  coords: {
    latitude: number;
    longitude: number;
  };
  geohash: string;
  platform: string;
  appVersion: string;
};

export const enrichLocationEvent = (
  raw: RawLocationEvent
): EnrichedLocationEvent | null => {
  const { latitude, longitude } = raw.coords;

  if (
    !isValidCoordinate(latitude, -90, 90) ||
    !isValidCoordinate(longitude, -180, 180)
  ) {
    console.warn("Invalid coordinates; skipping location event write.");
    return null;
  }

  const roundedLat = Number(latitude.toFixed(6));
  const roundedLon = Number(longitude.toFixed(6));

  const geohash = toGeohash(roundedLat, roundedLon, 7);

  const appVersion =
    Constants.expoConfig?.version ??
    (Constants.manifest as Partial<{ version?: string }> | null)?.version ??
    (Constants as unknown as { manifest2?: { version?: string } }).manifest2
      ?.version ??
    "unknown";

  return {
    userId: raw.userId,
    userEmail: raw.userEmail,
    bucketId: raw.bucketId,
    cityId: raw.cityId,
    coords: {
      latitude: roundedLat,
      longitude: roundedLon,
    },
    geohash,
    platform: Platform.OS,
    appVersion,
  };
};
