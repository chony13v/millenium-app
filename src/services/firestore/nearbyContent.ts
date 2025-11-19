import { FirebaseError } from "firebase/app";
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
const SCOPE_FIELD = "scope";
const NEIGHBORHOOD_SLUG_FIELD = "neighborhoodSlug";

const isMissingIndexError = (error: unknown): error is FirebaseError => {
  return (
    error instanceof FirebaseError &&
    error.code === "failed-precondition" &&
    typeof error.message === "string" &&
    error.message.includes("index")
  );
};

const mapSnapshot = <T extends Record<string, unknown>>(
  snapshot: T,
  id: string
) => ({
  id,
  data: snapshot,
});

interface FetchDocumentsOptions {
  suppressErrors?: boolean;
}

const fetchDocuments = async <T extends Record<string, unknown>>(
  collectionName: string,
  constraints: QueryConstraint[],
  { suppressErrors = true }: FetchDocumentsOptions = {}
): Promise<Array<FirestoreRecord<T>>> => {
  try {
    const baseQuery = query(collection(db, collectionName), ...constraints);
    const snap = await getDocs(baseQuery);
    return snap.docs.map((doc) => mapSnapshot(doc.data() as T, doc.id));
  } catch (error) {
    if (suppressErrors) {
      console.warn(
        `Failed to fetch documents from ${collectionName} with constraints`,
        error
      );
      return [];
    }

    throw error;
  }
};

export interface LoadNearbyNewsParams {
  selectedCityId?: string | null;
  neighborhoodSlug?: string | null;
  maxResults?: number;
  priority?: NewsPriority;
  scope?: NewsAudienceScope;
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
  "News(cityId ASC, createdAt DESC)",
  "News(cityId ASC, scope ASC, createdAt DESC)",
  "News(cityId ASC, scope ASC, neighborhoodSlug ASC, createdAt DESC)",
] as const;

const CREATED_AT_FIELD = "createdAt";
const PUBLISHED_AT_FIELD = "publishedAt";
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
export interface LoadNewsParams {
  selectedCityId?: string | null;
  locationBucket?: {
    citySlug?: string | null;
    neighborhoodSlug?: string | null;
  } | null;
  maxResults?: number;
}

/**
 * Obtiene noticias de ciudad y de barrio para la ciudad seleccionada. Siempre
 * devuelve las noticias con scope="city" filtradas por cityId y, si hay un
 * bucket válido, agrega las noticias con scope="neighborhood" cuyo
 * neighborhoodSlug coincide con el del bucket.
 */
export const loadNews = async <T extends Record<string, unknown>>({
  selectedCityId,
  locationBucket,
  maxResults = DEFAULT_NEWS_LIMIT,
}: LoadNewsParams): Promise<Array<FirestoreRecord<T>>> => {
  const normalizedCityId =
    typeof selectedCityId === "string" && selectedCityId.trim().length > 0
      ? selectedCityId
      : null;

  if (!normalizedCityId) {
    return [];
  }

  const normalizedLimit = Math.max(0, Math.floor(maxResults));
  const limitConstraint =
    normalizedLimit > 0 ? [limit(normalizedLimit)] : ([] as QueryConstraint[]);

  const cityConstraints = [where(CITY_ID_FIELD, "==", normalizedCityId)];

  let cityNews: Array<FirestoreRecord<T>> = [];

  try {
    cityNews = await fetchDocuments<T>(
      NEWS_COLLECTION,
      [...cityConstraints, orderBy(CREATED_AT_FIELD, "desc"), ...limitConstraint],
      { suppressErrors: false }
    );
  } catch (error) {
    if (isMissingIndexError(error)) {
      cityNews = await fetchDocuments<T>(NEWS_COLLECTION, [
        ...cityConstraints,
        ...limitConstraint,
      ]);
    } else {
      console.warn("loadNews: no se pudieron recuperar noticias de ciudad", error);
    }
  }

  const filteredCityNews = cityNews.filter(({ data }) => {
    const scope = (data as Record<string, unknown>)[SCOPE_FIELD];
    return scope !== "neighborhood";
  });

  const neighborhoodSlug =
    locationBucket?.citySlug === normalizedCityId
      ? locationBucket?.neighborhoodSlug?.trim()
      : null;

  let neighborhoodNews: Array<FirestoreRecord<T>> = [];

  if (neighborhoodSlug) {
    const neighborhoodConstraints = [
      where(CITY_ID_FIELD, "==", normalizedCityId),
      where(SCOPE_FIELD, "==", "neighborhood"),
      where(NEIGHBORHOOD_SLUG_FIELD, "==", neighborhoodSlug),
    ];

    try {
      neighborhoodNews = await fetchDocuments<T>(
        NEWS_COLLECTION,
        [
          ...neighborhoodConstraints,
          orderBy(CREATED_AT_FIELD, "desc"),
          ...limitConstraint,
        ],
        { suppressErrors: false }
      );
    } catch (error) {
      if (isMissingIndexError(error)) {
        neighborhoodNews = await fetchDocuments<T>(NEWS_COLLECTION, [
          ...neighborhoodConstraints,
          ...limitConstraint,
        ]);
      } else {
        console.warn(
          "loadNews: no se pudieron recuperar noticias de barrio",
          error
        );
      }
    }
  }

  const combined = sortByRecency([...filteredCityNews, ...neighborhoodNews]);
  return normalizedLimit > 0 ? combined.slice(0, normalizedLimit) : combined;
};

/**
 * Recupera noticias de una ciudad específica usando exclusivamente `cityId`.
 * Si Firestore solicita un índice para esta consulta, crea el compuesto
 * `News(cityId ASC, createdAt DESC)` desde la consola siguiendo el enlace
 * automático que provee el error.
 */
export const loadNearbyNews = async <T extends Record<string, unknown>>({
  selectedCityId,
  neighborhoodSlug = null,
  maxResults = DEFAULT_NEWS_LIMIT,
  priority = "currentCity",
  scope = "city",
}: LoadNearbyNewsParams): Promise<Array<RankedNewsRecord<T>>> => {
  const normalizedCityId =
    typeof selectedCityId === "string" && selectedCityId.trim().length > 0
      ? selectedCityId
      : null;

  if (!normalizedCityId) {
    return [];
  }
  // Reservado para futuros filtros por barrio.
  const neighborhoodNote = neighborhoodSlug
    ? ` (barrio ${neighborhoodSlug})`
    : "";

    const news = await loadNews<T>({
    selectedCityId: normalizedCityId,
    locationBucket: {
      citySlug: normalizedCityId,
      neighborhoodSlug,
    },
    maxResults,
  });

  return news.map((item) => {
    const itemScope =
      ((item.data as Record<string, unknown>)[SCOPE_FIELD] as NewsAudienceScope) ??
      "city";

    return {
      ...item,
      priority,
      scope: itemScope === "neighborhood" ? "neighborhood" : "city",
    };
  });
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
