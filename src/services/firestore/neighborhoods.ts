import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/config/FirebaseConfig";

export interface NeighborhoodDocument {
  id: string;
  cityId?: string;
  citySlug?: string | null;
  description?: string | null;
  latCenter?: number | null;
  lngCenter?: number | null;
  neighborhoodSlug?: string | null;
  name?: string | null;
  radiusKm2?: number | null;
  title?: string | null;
}

interface FetchNeighborhoodsParams {
  cityId?: string | null;
  citySlug?: string | null;
}

const normalizeString = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
};

const fetchNeighborhoodsByField = async (
  field: "cityId" | "citySlug",
  value: string
): Promise<NeighborhoodDocument[]> => {
  const neighborhoodQuery = query(
    collection(db, "Neighborhoods"),
    where(field, "==", value)
  );
  const snapshot = await getDocs(neighborhoodQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as NeighborhoodDocument[];
};

export const fetchNeighborhoods = async ({
  cityId,
  citySlug,
}: FetchNeighborhoodsParams): Promise<NeighborhoodDocument[]> => {
  const normalizedCityId = normalizeString(cityId);
  const normalizedSlug = normalizeString(citySlug);

  if (!normalizedCityId && !normalizedSlug) {
    return [];
  }

  try {
    const attempts: Array<["cityId" | "citySlug", string | null]> = [
      ["cityId", normalizedCityId],
      ["citySlug", normalizedSlug],
    ];

    for (const [field, value] of attempts) {
      if (!value) {
        continue;
      }

      try {
        const results = await fetchNeighborhoodsByField(field, value);
        if (results.length > 0) {
          return results;
        }
      } catch (innerError) {
        console.warn(
          `fetchNeighborhoods: failed to load neighborhoods by ${field}`,
          innerError
        );
      }
    }

    return [];
  } catch (error) {
    console.warn("fetchNeighborhoods: failed to load neighborhoods", error);
    return [];
  }
};
