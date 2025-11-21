import * as Location from "expo-location";
import { getDistance } from "geolib";

import { fetchNeighborhoodsByCitySlug } from "@/src/services/firestore/neighborhoods";

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

    const fallbackNeighborhood =
      result.district?.trim() || result.name?.trim() || null;
    const citySlug = slugify(city);

    if (citySlug) {
      const neighborhoods = await fetchNeighborhoodsByCitySlug(citySlug);
      const match = neighborhoods
        .map((neighborhood) => {
          const latCenter =
            typeof neighborhood.latCenter === "number"
              ? neighborhood.latCenter
              : null;
          const lngCenter =
            typeof neighborhood.lngCenter === "number"
              ? neighborhood.lngCenter
              : null;
          const radiusKm =
            typeof neighborhood.radiusKm2 === "number"
              ? neighborhood.radiusKm2
              : null;

          if (
            latCenter === null ||
            lngCenter === null ||
            radiusKm === null ||
            radiusKm <= 0
          ) {
            return null;
          }

          const distanceMeters = getDistance(
            {
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
            { latitude: latCenter, longitude: lngCenter }
          );

          return {
            neighborhood,
            distanceMeters,
          } as const;
        })
        .filter(
          (
            item
          ): item is {
            neighborhood: (typeof neighborhoods)[number];
            distanceMeters: number;
          } => Boolean(item)
        )
        .filter(({ neighborhood, distanceMeters }) => {
          const radiusKm =
            typeof neighborhood.radiusKm2 === "number"
              ? neighborhood.radiusKm2
              : 0;
          return distanceMeters <= radiusKm * 1000;
        })
        .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];

      if (match) {
        const name =
          match.neighborhood.title ||
          match.neighborhood.name ||
          fallbackNeighborhood;

        return {
          city,
          citySlug,
          neighborhood: name,
          neighborhoodSlug:
            match.neighborhood.neighborhoodSlug ?? slugify(name),
        };
      }
    }

    return {
      city,
      citySlug,
      neighborhood: fallbackNeighborhood,
      neighborhoodSlug: slugify(fallbackNeighborhood),
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
