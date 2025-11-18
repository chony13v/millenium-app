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
  try {
    const baseQuery = query(collection(db, collectionName), ...constraints);
    const snap = await getDocs(baseQuery);
    return snap.docs.map((doc) => mapSnapshot(doc.data() as T, doc.id));
  } catch (error) {
    console.warn(
      `Failed to fetch documents from ${collectionName} with constraints`,
      error
    );
    return [];
  }
};

export interface LoadNearbyNewsParams {
  citySlugCurrent?: string | null;
  cityIdCurrent?: string | null;
  neighborhoodSlugCurrent?: string | null;
  cityIdPreferred?: string | null;
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
  "News(cityId ASC, createdAt DESC)",
  "News(cityId ASC, audienceScope ASC, neighborhoodSlug ASC, createdAt DESC)",
] as const;

const CREATED_AT_FIELD = "createdAt";
const PUBLISHED_AT_FIELD = "publishedAt";
const AUDIENCE_SCOPE_FIELD = "audienceScope";
const NEIGHBORHOOD_SLUG_FIELD = "neighborhoodSlug";
const CITY_SLUG_FIELD = "citySlug";
const CITY_ID_FIELD = "cityId";

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

const buildCityFieldCandidates = (
  citySlug?: string | null,
  cityId?: string | null
): Array<{ field: string; value: string }> => {
  const candidates: Array<{ field: string; value: string }> = [];
  const seen = new Set<string>();

  const pushCandidate = (field: string, value?: string | null) => {
    if (!value) {
      return;
    }
    const key = `${field}:${value}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    candidates.push({ field, value });
  };

  pushCandidate(CITY_SLUG_FIELD, citySlug);
  pushCandidate(CITY_ID_FIELD, cityId);

  return candidates;
};

interface FetchCityScopedNewsParams {
  citySlug?: string | null;
  cityId?: string | null;
  neighborhoodSlug?: string | null;
  scope: NewsAudienceScope;
  maxResults: number;
}

const fetchCityScopedNews = async <T extends Record<string, unknown>>({
  citySlug,
  cityId,
  neighborhoodSlug,
  scope,
  maxResults,
}: FetchCityScopedNewsParams): Promise<Array<FirestoreRecord<T>>> => {
  if (scope === "neighborhood" && !neighborhoodSlug) {
    return [];
  }

  const baseConstraints: QueryConstraint[] = [
    where(AUDIENCE_SCOPE_FIELD, "==", scope),
    ...(scope === "neighborhood"
      ? [where(NEIGHBORHOOD_SLUG_FIELD, "==", neighborhoodSlug as string)]
      : []),
    orderBy(CREATED_AT_FIELD, "desc"),
    limit(maxResults),
  ];

  for (const candidate of buildCityFieldCandidates(citySlug, cityId)) {
    const constraints: QueryConstraint[] = [
      where(candidate.field, "==", candidate.value),
      ...baseConstraints,
    ];

    try {
      const docs = await fetchDocuments<T>(NEWS_COLLECTION, constraints);
      if (docs.length > 0) {
        return docs;
      }
    } catch (error) {
      console.warn(
        `loadNearbyNews: consulta fallida (${candidate.field}=${candidate.value})`,
        error
      );
    }
  }

  return [];
};

/**
 * Recupera noticias priorizando barrio actual → ciudad actual → ciudad preferida.
 * Las consultas requieren índices Firestore declarados en `NEWS_REQUIRED_INDEXES`.
 */
export const loadNearbyNews = async <T extends Record<string, unknown>>({
  citySlugCurrent,
  cityIdCurrent,
  neighborhoodSlugCurrent,
  citySlugPreferred,
  cityIdPreferred,
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
    Boolean(neighborhoodSlugCurrent) &&
    (Boolean(citySlugCurrent) || Boolean(cityIdCurrent));

  if (neighborhoodEligible && orderedResults.length < maxResults) {
    const neighborhoodItems = await fetchCityScopedNews<T>({
      citySlug: citySlugCurrent,
      cityId: cityIdCurrent,
      neighborhoodSlug: neighborhoodSlugCurrent ?? null,
      scope: "neighborhood",
      maxResults,
    });
    collect(
      sortByRecency(neighborhoodItems),
      "currentNeighborhood",
      "neighborhood"
    );
  }

  if (
    (citySlugCurrent || cityIdCurrent) &&
    orderedResults.length < maxResults
  ) {
    const cityItems = await fetchCityScopedNews<T>({
      citySlug: citySlugCurrent,
      cityId: cityIdCurrent,
      scope: "city",
      maxResults,
    });
    collect(sortByRecency(cityItems), "currentCity", "city");
  }

  const shouldQueryPreferred =
    (Boolean(citySlugPreferred) || Boolean(cityIdPreferred)) &&
    !(
      (citySlugPreferred && citySlugPreferred === citySlugCurrent) ||
      (cityIdPreferred && cityIdPreferred === cityIdCurrent)
    );

  if (shouldQueryPreferred && orderedResults.length < maxResults) {
    const preferredItems = await fetchCityScopedNews<T>({
      citySlug: citySlugPreferred,
      cityId: cityIdPreferred,
      scope: "city",
      maxResults,
    });
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
  const normalizedRadius = Math.max(0, Math.floor(radius));
  const neighbors: Array<{ lat: number; lon: number }> = [];

  for (
    let latStep = -normalizedRadius;
    latStep <= normalizedRadius;
    latStep += 1
  ) {
    for (
      let lonStep = -normalizedRadius;
      lonStep <= normalizedRadius;
      lonStep += 1
    ) {
      neighbors.push({
        lat: Number((latBucket + latStep * 0.005).toFixed(6)),
        lon: Number((lonBucket + lonStep * 0.005).toFixed(6)),
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
  const normalizedLimit = Math.max(0, Math.floor(maxResults));
  const limitOrInfinity = normalizedLimit > 0 ? normalizedLimit : Infinity;
  const results = new Map<string, FirestoreRecord<T>>();
  const collect = (items: Array<FirestoreRecord<T>>) => {
    for (const item of items) {
      if (results.size >= limitOrInfinity) {
        break;
      }
      if (!results.has(item.id)) {
        results.set(item.id, item);
      }
    }
  };

  const bucketsAreValid =
    Number.isFinite(latBucket) && Number.isFinite(lonBucket);

  if (bucketsAreValid && limitOrInfinity !== 0) {
    const neighbors = buildBucketGrid(
      latBucket as number,
      lonBucket as number,
      Math.max(bucketRadius, 0)
    );
    const neighborQueries = await Promise.all(
      neighbors.map((neighbor) =>
        fetchDocuments<T>(FIELD_COLLECTION, [
          where("latBucket", "==", neighbor.lat),
          where("lonBucket", "==", neighbor.lon),
        ])
      )
    );

    for (const items of neighborQueries) {
      collect(items);
      if (results.size >= limitOrInfinity) {
        break;
      }
      collect(items);
    }
  }

  if (results.size < limitOrInfinity && citySlug) {
    const constraints: QueryConstraint[] = [where("citySlug", "==", citySlug)];
    const items = await fetchDocuments<T>(FIELD_COLLECTION, constraints);
    collect(items);
  }

  const finalResults = Array.from(results.values());
  return normalizedLimit > 0
    ? finalResults.slice(0, normalizedLimit)
    : finalResults;
};
