import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";

import { db } from "@/config/FirebaseConfig";

export interface FirestoreRecord<T extends Record<string, unknown>> {
  id: string;
  data: T;
}

const NEWS_COLLECTION = "News";
const FIELD_COLLECTION = "Field";
const DEFAULT_NEWS_LIMIT = 20;
const DEFAULT_FIELD_LIMIT = 20;

const mapSnapshot = <T extends Record<string, unknown>>(snapshot: T, id: string) => ({
  id,
  data: snapshot,
});

const fetchDocuments = async <T extends Record<string, unknown>>(
  collectionName: string,
  constraints: QueryConstraint[]
): Promise<Array<FirestoreRecord<T>>> => {
  const baseQuery = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(baseQuery);
  return snap.docs.map((doc) => mapSnapshot(doc.data() as T, doc.id));
};

export interface LoadNearbyNewsParams {
  citySlug?: string | null;
  neighborhoodSlug?: string | null;
  latBucket?: number | null;
  lonBucket?: number | null;
  maxResults?: number;
}

/**
 * Recupera noticias cercanas priorizando barrio → ciudad → proximidad geográfica.
 * Las colecciones deben tener índices para (neighborhoodSlug, publishedAt) y
 * (citySlug, publishedAt) si se utilizan los `orderBy`.
 */
export const loadNearbyNews = async <T extends Record<string, unknown>>({
  citySlug,
  neighborhoodSlug,
  latBucket,
  lonBucket,
  maxResults = DEFAULT_NEWS_LIMIT,
}: LoadNearbyNewsParams): Promise<Array<FirestoreRecord<T>>> => {
  const results = new Map<string, FirestoreRecord<T>>();

  const collect = (items: Array<FirestoreRecord<T>>) => {
    for (const item of items) {
      if (results.size >= maxResults) {
        break;
      }
      if (!results.has(item.id)) {
        results.set(item.id, item);
      }
    }
  };

  const remaining = () => Math.max(maxResults - results.size, 0);

  if (neighborhoodSlug) {
    const constraints: QueryConstraint[] = [
      where("neighborhoodSlug", "==", neighborhoodSlug),
    ];

    if (remaining() > 0) {
      constraints.push(orderBy("publishedAt", "desc"));
      constraints.push(limit(remaining()));
      const neighborhoodItems = await fetchDocuments<T>(NEWS_COLLECTION, constraints);
      collect(neighborhoodItems);
    }
  }

  if (results.size < maxResults && citySlug) {
    const constraints: QueryConstraint[] = [where("citySlug", "==", citySlug)];

    if (remaining() > 0) {
      constraints.push(orderBy("publishedAt", "desc"));
      constraints.push(limit(remaining()));
      const cityItems = await fetchDocuments<T>(NEWS_COLLECTION, constraints);
      collect(cityItems);
    }
  }

  if (
    results.size < maxResults &&
    typeof latBucket === "number" &&
    typeof lonBucket === "number"
  ) {
    const constraints: QueryConstraint[] = [
      where("latBucket", "==", latBucket),
      where("lonBucket", "==", lonBucket),
    ];

    if (remaining() > 0) {
      constraints.push(limit(remaining()));
      const bucketItems = await fetchDocuments<T>(NEWS_COLLECTION, constraints);
      collect(bucketItems);
    }
  }

  return Array.from(results.values());
};

export interface LoadNearbyFieldsParams {
  latBucket?: number | null;
  lonBucket?: number | null;
  bucketRadius?: number;
  citySlug?: string | null;
  maxResults?: number;
}

const buildBucketGrid = (
  latBucket: number,
  lonBucket: number,
  radius: number
): Array<{ lat: number; lon: number }> => {
  const neighbors: Array<{ lat: number; lon: number }> = [];
  for (let latStep = -radius; latStep <= radius; latStep += 1) {
    for (let lonStep = -radius; lonStep <= radius; lonStep += 1) {
      neighbors.push({ lat: latBucket + latStep * 0.005, lon: lonBucket + lonStep * 0.005 });
    }
  }
  return neighbors;
};

/**
 * Recupera canchas cercanas iterando por celdas de bucket (±radius). Requiere
 * índices compuestos para (latBucket, lonBucket) si se agrega un `where`
 * adicional o campos de latitud/longitud en los documentos.
 */
export const loadNearbyFields = async <T extends Record<string, unknown>>({
  latBucket,
  lonBucket,
  bucketRadius = 1,
  citySlug,
  maxResults = DEFAULT_FIELD_LIMIT,
}: LoadNearbyFieldsParams): Promise<Array<FirestoreRecord<T>>> => {
  const results = new Map<string, FirestoreRecord<T>>();
  const collect = (items: Array<FirestoreRecord<T>>) => {
    for (const item of items) {
      if (results.size >= maxResults) {
        break;
      }
      if (!results.has(item.id)) {
        results.set(item.id, item);
      }
    }
  };

  if (typeof latBucket === "number" && typeof lonBucket === "number") {
    const neighbors = buildBucketGrid(latBucket, lonBucket, Math.max(bucketRadius, 0));
    for (const neighbor of neighbors) {
      if (results.size >= maxResults) {
        break;
      }

      const constraints: QueryConstraint[] = [
        where("latBucket", "==", neighbor.lat),
        where("lonBucket", "==", neighbor.lon),
      ];

      const items = await fetchDocuments<T>(FIELD_COLLECTION, constraints);
      collect(items);
    }
  }

  if (results.size < maxResults && citySlug) {
    const constraints: QueryConstraint[] = [where("citySlug", "==", citySlug)];
    const items = await fetchDocuments<T>(FIELD_COLLECTION, constraints);
    collect(items);
  }

  return Array.from(results.values());
};