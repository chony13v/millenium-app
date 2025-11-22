import * as Location from "expo-location";
import { getDistance } from "geolib";

import { getCityIdBySlug } from "@/constants/cities";
import { fetchNeighborhoods } from "@/src/services/firestore/neighborhoods";

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
  cityId: string | null;
  city: string | null;
  citySlug: string | null;
  neighborhood: string | null;
  neighborhoodSlug: string | null;
  neighborhoodDescription: string | null;
  isWithinNeighborhoodRadius: boolean;
}
const getRadiusKm = (
  neighborhood: Awaited<ReturnType<typeof fetchNeighborhoods>>[number]
): number | null => {
  if (typeof neighborhood.radiusKm2 === "number") {
    return neighborhood.radiusKm2;
  }

  if (typeof (neighborhood as unknown as Record<string, unknown>).radiusKm === "number") {
    return (neighborhood as unknown as Record<string, number>).radiusKm;
  }

  return null;
};

const DEFAULT_RADIUS_KM = 2;

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
        cityId: null,
        city: null,
        citySlug: null,
        neighborhood: null,
        neighborhoodSlug: null,
        neighborhoodDescription: null,
        isWithinNeighborhoodRadius: false,
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
    const cityId = getCityIdBySlug(citySlug);

    if (citySlug) {
      const neighborhoods = await fetchNeighborhoods({ cityId, citySlug });
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
               const radiusKm = getRadiusKm(neighborhood);

          if (
            latCenter === null ||
            lngCenter === null ||
     (radiusKm !== null && radiusKm <= 0)
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
           const radiusKm = getRadiusKm(neighborhood) ?? DEFAULT_RADIUS_KM;
          return distanceMeters <= radiusKm * 1000;
        })
        .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];

      if (match) {
        const name =
          match.neighborhood.title ||
          match.neighborhood.name ||
          fallbackNeighborhood;

        return {
          cityId,
          city,
          citySlug,
          neighborhood: name,
          neighborhoodSlug:
            match.neighborhood.neighborhoodSlug ?? slugify(name),
            
           neighborhoodDescription:
            typeof match.neighborhood.description === "string"
              ? match.neighborhood.description
              : null,
          isWithinNeighborhoodRadius: true,
        };
      }
    }

    return {
      cityId,
      city,
      citySlug,
      neighborhood: fallbackNeighborhood,
      neighborhoodSlug: slugify(fallbackNeighborhood),
 neighborhoodDescription: null,
      isWithinNeighborhoodRadius: false,
    };
  } catch (error) {
    console.warn("inferNeighborhoodFromCoords failed", error);
    return {
      cityId: null,
      city: null,
      citySlug: null,
      neighborhood: null,
      neighborhoodSlug: null,
     neighborhoodDescription: null,
      isWithinNeighborhoodRadius: false,
    };
  }
};
