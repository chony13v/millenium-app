import * as Location from "expo-location";

export const toBucket = (value: number, step: number = 0.005): number => {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) {
    return 0;
  }

  const scaled = Math.round(value / step) * step;
  return Number(scaled.toFixed(6));
};

export const slugify = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  const slug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || null;
};

export interface InferredNeighborhood {
  city: string | null;
  citySlug: string | null;
  neighborhood: string | null;
  neighborhoodSlug: string | null;
}

export const inferNeighborhoodFromCoords = async (
  coords: Location.LocationObjectCoords
): Promise<InferredNeighborhood> => {
  try {
    const [result] = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    if (!result) {
      return {
        city: null,
        citySlug: null,
        neighborhood: null,
        neighborhoodSlug: null,
      };
    }

    const city =
      result.city?.trim() ||
      result.subregion?.trim() ||
      result.region?.trim() ||
      null;

    const neighborhood = result.district?.trim() || result.name?.trim() || null;

    return {
      city,
      citySlug: slugify(city),
      neighborhood,
      neighborhoodSlug: slugify(neighborhood),
    };
  } catch (error) {
    console.warn("inferNeighborhoodFromCoords failed", error);
    return {
      city: null,
      citySlug: null,
      neighborhood: null,
      neighborhoodSlug: null,
    };
  }
};
