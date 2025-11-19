import * as Location from "expo-location";
import {
  collection,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { logEvent, setUserProperties } from "firebase/analytics";
import * as Analytics from "expo-firebase-analytics";

import { analytics, db } from "@/config/FirebaseConfig";
import { safeAnalyticsParams } from "@/src/analytics/safeParams";

const DEFAULT_STEP = 0.01;

const getPrecision = (step: number) => {
  if (step <= 0) {
    return 2;
  }
  const precision = Math.round(Math.log10(1 / step));
  return precision > 0 ? precision : 0;
};

const normalizeCenter = (value: unknown, precision: number): number => {
  if (typeof value === "number") {
    return Number(value.toFixed(precision));
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return Number(parsed.toFixed(precision));
    }
  }

  return 0;
};

/**
 * Redondea un valor numérico a la cuadrícula indicada. Con step=0.01 (~1 km),
 * cualquier coordenada se ajusta al centro del bucket correspondiente.
 */
export const grid = (value: number, step: number = DEFAULT_STEP): number => {
  const precision = getPrecision(step);
  const scaled = Math.round(value / step) * step;
  return Number(scaled.toFixed(Math.min(6, precision + 2)));
};

/**
 * Genera un identificador de bucket geográfico (~1 km) a partir de lat/lng,
 * devolviendo un string lat,lng redondeado a la cuadrícula indicada.
 */
export const makeBucketId = (
  latitude: number,
  longitude: number,
  step: number = DEFAULT_STEP
): string => {
  const precision = getPrecision(step);
  const latCenter = grid(latitude, step).toFixed(precision);
  const lngCenter = grid(longitude, step).toFixed(precision);
  return `${latCenter},${lngCenter}`;
};

export interface UserLocationBucket {
  bucketId: string;
  latCenter: number;
  lngCenter: number;
  visits: number;
}

export interface ResolvedGeocodePlace {
  neighborhood?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  isoCountryCode?: string | null;
  formattedAddress?: string | null;
}

export interface PersistedLocationResult {
  bucket: UserLocationBucket;
  place: ResolvedGeocodePlace | null;
}

interface PersistBucketBasePayload {
  userId: string;
  coords: Location.LocationObjectCoords;
  step: number;
  extraData?: Record<string, unknown>;
}

const logLocationEvent = async (
  eventName: string,
  bucketId: string,
  step: number,
  params: Record<string, unknown> = {}
) => {
  try {
    const payload = safeAnalyticsParams(
      {
        bucket_id: bucketId,
        grid_size_deg: Number.isFinite(step) ? step.toFixed(2) : "unknown",
        ...params,
      },
      { fallbackValue: "unknown" }
    );

    try {
      await Analytics.logEvent(eventName, payload);
    } catch (err) {
      console.warn("expo-firebase-analytics tracking failed:", err);
    }

    if (!analytics) {
      return;
    }

    logEvent(analytics, eventName, payload);
  } catch (analyticsError) {
    console.warn("Analytics tracking failed", analyticsError);
  }
};

const persistBucketBase = async ({
  userId,
  coords,
  step,
  extraData = {},
}: PersistBucketBasePayload) => {
  const latCenter = grid(coords.latitude, step);
  const lngCenter = grid(coords.longitude, step);
  const bucketId = makeBucketId(coords.latitude, coords.longitude, step);

  const bucketRef = doc(db, "users", userId, "locationBuckets", bucketId);
  await setDoc(
    bucketRef,
    {
      bucketId,
      latCenter,
      lngCenter,
      count: increment(1),
      updatedAt: serverTimestamp(),
      ...extraData,
    },
    { merge: true }
  );

  return { bucketId, latCenter, lngCenter };
};

const normalizePlace = (
  place: ResolvedGeocodePlace | null | undefined
): ResolvedGeocodePlace | null => {
  if (!place) {
    return null;
  }

  return {
    neighborhood: place.neighborhood ?? null,
    city: place.city ?? null,
    region: place.region ?? null,
    country: place.country ?? null,
    isoCountryCode: place.isoCountryCode ?? null,
    formattedAddress: place.formattedAddress ?? null,
  };
};

export const persistUserLocationBucket = async ({
  userId,
  coords,
  step = DEFAULT_STEP,
  place,
  source = "manual_update",
}: {
  userId: string | null | undefined;
  coords: Location.LocationObjectCoords;
  step?: number;
  place?: ResolvedGeocodePlace | null;
  source?: string;
}): Promise<PersistedLocationResult | null> => {
  if (!userId) {
    return null;
  }

  const normalizedPlace = normalizePlace(place);

  const extraData: Record<string, unknown> = {
    source,
  };

  if (normalizedPlace) {
    extraData.lastResolvedNeighborhood = normalizedPlace.neighborhood ?? null;
    extraData.lastResolvedCity = normalizedPlace.city ?? null;
    extraData.lastResolvedRegion = normalizedPlace.region ?? null;
    extraData.lastResolvedCountry = normalizedPlace.country ?? null;
    extraData.lastResolvedIsoCountry = normalizedPlace.isoCountryCode ?? null;
    extraData.lastResolvedFormatted = normalizedPlace.formattedAddress ?? null;
  }

  const { bucketId, latCenter, lngCenter } = await persistBucketBase({
    userId,
    coords,
    step,
    extraData,
  });

  await logLocationEvent("location_bucket_manual_update", bucketId, step, {
    source,
  });

  const bucket = (await getUserTopBucket(userId, step)) ?? {
    bucketId,
    latCenter,
    lngCenter,
    visits: 1,
  };

  return {
    bucket,
    place: normalizedPlace,
  };
};

/**
 * Registra la apertura de la pestaña Field incrementando el contador del bucket
 * geográfico aproximado (~1 km). No interrumpe el flujo si falla la ubicación
 * o la escritura en Firestore.
 */
export const trackLocationBucketOnFieldOpen = async (
  userId: string | null | undefined,
  step: number = DEFAULT_STEP
): Promise<UserLocationBucket | null> => {
  if (!userId) {
    return null;
  }

  try {
    let permission = await Location.getForegroundPermissionsAsync();
    let status = permission.status;

    if (status !== "granted") {
      permission = await Location.requestForegroundPermissionsAsync();
      status = permission.status;
    }

    if (status !== "granted") {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { bucketId, latCenter, lngCenter } = await persistBucketBase({
      userId,
      coords: location.coords,
      step,
      extraData: { source: "field_open" },
    });

    await logLocationEvent("field_tab_opened", bucketId, step, {
      source: "field_open",
    });

    let topBucket: UserLocationBucket | null = null;
    let secondCount = 0;

    try {
      const bucketsSnapshot = await getDocs(
        query(
          collection(db, "users", userId, "locationBuckets"),
          orderBy("count", "desc"),
          limit(2)
        )
      );

      if (!bucketsSnapshot.empty) {
        const precision = getPrecision(step);
        const topDoc = bucketsSnapshot.docs[0];
        const topData = topDoc.data() as DocumentData;
        topBucket = {
          bucketId: topDoc.id,
          latCenter: normalizeCenter(topData.latCenter, precision),
          lngCenter: normalizeCenter(topData.lngCenter, precision),
          visits: (topData.count ?? 0) as number,
        };

        const secondDoc = bucketsSnapshot.docs[1];
        secondCount = secondDoc ? ((secondDoc.data().count ?? 0) as number) : 0;
      }

      if (analytics && topBucket) {
        if (topBucket.visits >= 10 && topBucket.visits >= secondCount * 2) {
          try {
            setUserProperties(analytics, {
              home_bucket: topBucket.bucketId,
            });
          } catch (analyticsError) {
            console.warn("Analytics tracking failed", analyticsError);
          }
        }
      }
    } catch (queryError) {
      console.warn(
        "Failed to load location buckets after tracking",
        queryError
      );
    }

    return topBucket;
  } catch (error) {
    console.warn("trackLocationBucketOnFieldOpen failed", error);
    return null;
  }
};

/**
 * Obtiene el bucket geográfico (~1 km) con más visitas del usuario o null si no
 * hay datos suficientes.
 */
export const getUserTopBucket = async (
  userId: string | null | undefined,
  step: number = DEFAULT_STEP
): Promise<UserLocationBucket | null> => {
  if (!userId) {
    return null;
  }

  try {
    const bucketsRef = collection(db, "users", userId, "locationBuckets");
    const bucketsSnapshot = await getDocs(
      query(bucketsRef, orderBy("count", "desc"), limit(1))
    );

    if (bucketsSnapshot.empty) {
      return null;
    }

    const docSnap = bucketsSnapshot.docs[0];
    const data = docSnap.data() as DocumentData;
    const precision = getPrecision(step);

    return {
      bucketId: docSnap.id,
      latCenter: normalizeCenter(data.latCenter, precision),
      lngCenter: normalizeCenter(data.lngCenter, precision),
      visits: (data.count ?? 0) as number,
    };
  } catch (error) {
    console.warn("getUserTopBucket failed", error);
    return null;
  }
};
