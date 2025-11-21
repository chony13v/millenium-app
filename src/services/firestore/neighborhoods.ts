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

export const fetchNeighborhoodsByCitySlug = async (
  citySlug: string
): Promise<NeighborhoodDocument[]> => {
  const normalizedSlug = citySlug.trim();
  if (!normalizedSlug) {
    return [];
  }

  try {
    const neighborhoodQuery = query(
      collection(db, "Neighborhoods"),
      where("citySlug", "==", normalizedSlug)
    );
    const snapshot = await getDocs(neighborhoodQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as NeighborhoodDocument[];
  } catch (error) {
    console.warn(
      "fetchNeighborhoodsByCitySlug: failed to load neighborhoods",
      error
    );
    return [];
  }
};
