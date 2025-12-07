import type { AttendanceCoords } from "@/services/events/types";

const EARTH_RADIUS_METERS = 6371000;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const haversineDistanceMeters = (
  from: AttendanceCoords,
  to: AttendanceCoords
) => {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
};

export const isWithinRadius = (
  center: AttendanceCoords | null | undefined,
  radiusMeters: number | null | undefined,
  coords: AttendanceCoords | null | undefined
) => {
  if (!center || !radiusMeters || !coords) {
    return { distanceMeters: null, isInside: true, radiusMeters: radiusMeters ?? null };
  }

  const distanceMeters = haversineDistanceMeters(coords, center);
  return {
    distanceMeters,
    isInside: distanceMeters <= radiusMeters,
    radiusMeters,
  };
};