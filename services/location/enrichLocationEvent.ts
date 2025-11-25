import { Platform } from "react-native";
import Constants from "expo-constants";
import type * as Location from "expo-location";
import { toGeohash } from "@/utils/geo";
import { hashUserId } from "@/utils/hash";
import { getAnonSalt } from "@/config/PrivacyConfig";
import type { CityId } from "@/constants/cities";

const isValidCoordinate = (value: number, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;

const mapPermissionStatus = (
  status: Location.PermissionStatus | "limited" | undefined
): "granted" | "denied" | "limited" | "unknown" => {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  if (status === "limited") return "limited";
  return "unknown";
};

export type RawLocationEvent = {
  userId: string;
  cityId: CityId | null;
  bucketId: string;
  coords: Location.LocationObjectCoords;
  consentGiven: boolean;
  permissionStatus: Location.PermissionStatus | "limited";
  eventType: "foreground_ping" | "manual_update" | "background";
  locationMethod?: "gps" | "network" | "fused" | "unknown";
  timestamp?: number;
};

export type EnrichedLocationEvent = {
  bucketId: string;
  cityId: CityId | null;
  userAnonId: string;
  consentGiven: boolean;
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  geohash: string;
  date: string;
  hour: number;
  weekday: number;
  locationMethod: "gps" | "network" | "fused" | "unknown";
  permissionStatus: "granted" | "denied" | "limited" | "unknown";
  eventType: "foreground_ping" | "manual_update" | "background";
  appVersion: string;
  platform: string;
  provinceId: string | null;
  cantonId: string | null;
  parishId: string | null;
  neighborhoodSlug: string | null;
  timestamp: number;
};

export const enrichLocationEvent = (
  raw: RawLocationEvent
): EnrichedLocationEvent | null => {
  const anonSalt = getAnonSalt();

  if (!anonSalt) {
    console.warn("ANON_SALT is missing; skipping location event write.");
    return null;
  }

  if (!raw.consentGiven) {
    console.warn("Consent not granted; skipping location event write.");
    return null;
  }

  const { latitude, longitude, accuracy } = raw.coords;

  if (!isValidCoordinate(latitude, -90, 90) || !isValidCoordinate(longitude, -180, 180)) {
    console.warn("Invalid coordinates; skipping location event write.");
    return null;
  }

  if (typeof accuracy !== "number" || !Number.isFinite(accuracy) || accuracy > 75) {
    console.warn("Low accuracy coordinates; skipping location event write.");
    return null;
  }

  const roundedLat = Number(latitude.toFixed(6));
  const roundedLon = Number(longitude.toFixed(6));
  const timestamp = raw.timestamp ?? Date.now();
  const timestampDate = new Date(timestamp);

  const geohash = toGeohash(roundedLat, roundedLon, 7);
  const isoString = timestampDate.toISOString();

  const appVersion =
    Constants.expoConfig?.version ??
    (Constants.manifest as Partial<{ version?: string }> | null)?.version ??
    (Constants as unknown as { manifest2?: { version?: string } }).manifest2?.version ??
    "unknown";

  return {
    bucketId: raw.bucketId,
    cityId: raw.cityId,
    userAnonId: hashUserId(raw.userId, anonSalt),
    consentGiven: raw.consentGiven,
    coords: {
      latitude: roundedLat,
      longitude: roundedLon,
      accuracy,
    },
    geohash,
    date: isoString.slice(0, 10),
    hour: timestampDate.getUTCHours(),
    weekday: timestampDate.getUTCDay(),
    locationMethod: raw.locationMethod ?? "unknown",
    permissionStatus: mapPermissionStatus(raw.permissionStatus),
    eventType: raw.eventType,
    appVersion,
    platform: Platform.OS,
    provinceId: null, // TODO: derive from territorial catalogs
    cantonId: null, // TODO: derive from territorial catalogs
    parishId: null, // TODO: derive from territorial catalogs
    neighborhoodSlug: null, // TODO: derive from territorial catalogs
    timestamp,
  };
};