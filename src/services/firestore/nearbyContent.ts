import {
  Timestamp,
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

const mapSnapshot = <T extends Record<string, unknown>>(
  snapshot: T,
  id: string
) => ({
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
  citySlugCurrent?: string | null;
  neighborhoodSlugCurrent?: string | null;
  citySlugPreferred?: string | null;
  maxResults?: number;
}
export type NewsAudienceScope = "city" | "neighborhood";

export type NewsPriority =
  | "currentNeighborhood"
  | "currentCity"
  | "preferredCity";

export interface RankedNewsRecord<T extends Record<string, unknown>>
  extends FirestoreRecord<T> {
  priority: NewsPriority;
  scope: NewsAudienceScope;
}

export const NEWS_REQUIRED_INDEXES = [
  "News(citySlug ASC, createdAt DESC)",
  "News(citySlug ASC, audienceScope ASC, neighborhoodSlug ASC, createdAt DESC)",
] as const;

const CREATED_AT_FIELD = "createdAt";
const PUBLISHED_AT_FIELD = "publishedAt";
const AUDIENCE_SCOPE_FIELD = "audienceScope";
const NEIGHBORHOOD_SLUG_FIELD = "neighborhoodSlug";
const CITY_SLUG_FIELD = "citySlug";

const toMillis = (value: unknown): number => {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (value instanceof Timestamp) {
    return value.toDate().getTime();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (
    value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    try {
      const date = (value as { toDate: () => Date }).toDate();
      return date.getTime();
    } catch (error) {
      console.warn("No se pudo convertir la fecha de la noticia", error);
    }
  }

  return 0;
};

const sortByRecency = <T extends Record<string, unknown>>(
  items: Array<FirestoreRecord<T>>
) => {
  return [...items].sort((a, b) => {
    const right = toMillis(
      (b.data as Record<string, unknown>)[CREATED_AT_FIELD] ??
        (b.data as Record<string, unknown>)[PUBLISHED_AT_FIELD] ??
        null
    );
    const left = toMillis(
      (a.data as Record<string, unknown>)[CREATED_AT_FIELD] ??
        (a.data as Record<string, unknown>)[PUBLISHED_AT_FIELD] ??
        null
    );

    return right - left;
  });
};

/**
 * Recupera noticias priorizando barrio actual → ciudad actual → ciudad preferida.
 * Las consultas requieren índices Firestore declarados en `NEWS_REQUIRED_INDEXES`.
 */
export const loadNearbyNews = async <T extends Record<string, unknown>>({
  citySlugCurrent,
  neighborhoodSlugCurrent,
  citySlugPreferred,
  maxResults = DEFAULT_NEWS_LIMIT,
}: LoadNearbyNewsParams): Promise<Array<RankedNewsRecord<T>>> => {
  const collectedIds = new Set<string>();
  const orderedResults: Array<RankedNewsRecord<T>> = [];

  const collect = (
    items: Array<FirestoreRecord<T>>,
    priority: NewsPriority,
    scope: NewsAudienceScope
  ) => {
    for (const item of items) {
      if (collectedIds.has(item.id)) {
        continue;
      }
      collectedIds.add(item.id);
      orderedResults.push({ ...item, priority, scope });

      if (orderedResults.length >= maxResults) {
        break;
      }
    }
  };

  const neighborhoodEligible =
    Boolean(citySlugCurrent) && Boolean(neighborhoodSlugCurrent);

  if (neighborhoodEligible && orderedResults.length < maxResults) {
    const constraints: QueryConstraint[] = [
      where(CITY_SLUG_FIELD, "==", citySlugCurrent),
      where(AUDIENCE_SCOPE_FIELD, "==", "neighborhood"),
      where(NEIGHBORHOOD_SLUG_FIELD, "==", neighborhoodSlugCurrent),
      orderBy(CREATED_AT_FIELD, "desc"),
      limit(maxResults),
    ];

    const neighborhoodItems = await fetchDocuments<T>(
      NEWS_COLLECTION,
      constraints
    );
    collect(
      sortByRecency(neighborhoodItems),
      "currentNeighborhood",
      "neighborhood"
    );
  }

  if (citySlugCurrent && orderedResults.length < maxResults) {
    const constraints: QueryConstraint[] = [
      where(CITY_SLUG_FIELD, "==", citySlugCurrent),
      where(AUDIENCE_SCOPE_FIELD, "==", "city"),
      orderBy(CREATED_AT_FIELD, "desc"),
      limit(maxResults),
    ];
    const cityItems = await fetchDocuments<T>(NEWS_COLLECTION, constraints);
    collect(sortByRecency(cityItems), "currentCity", "city");
  }

  const shouldQueryPreferred =
    Boolean(citySlugPreferred) && citySlugPreferred !== citySlugCurrent;

  if (shouldQueryPreferred && orderedResults.length < maxResults) {
    const constraints: QueryConstraint[] = [
      where(CITY_SLUG_FIELD, "==", citySlugPreferred),
      where(AUDIENCE_SCOPE_FIELD, "==", "city"),
      orderBy(CREATED_AT_FIELD, "desc"),
      limit(maxResults),
    ];

    const preferredItems = await fetchDocuments<T>(
      NEWS_COLLECTION,
      constraints
    );
    collect(sortByRecency(preferredItems), "preferredCity", "city");
  }

  return orderedResults;
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
      neighbors.push({
        lat: latBucket + latStep * 0.005,
        lon: lonBucket + lonStep * 0.005,
      });
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
    const neighbors = buildBucketGrid(
      latBucket,
      lonBucket,
      Math.max(bucketRadius, 0)
    );
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
