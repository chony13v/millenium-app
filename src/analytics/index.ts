import * as Analytics from "expo-firebase-analytics";

type AnalyticsParamValue = string | number | boolean;
type AnalyticsParams = Record<string, AnalyticsParamValue>;

const VALID_PARAM_NAME = /^[A-Za-z][A-Za-z0-9_]{0,23}$/;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const sanitizeAnalyticsParams = (
  params: Record<string, unknown> | null | undefined
): AnalyticsParams => {
  if (!isPlainObject(params)) {
    return {};
  }

  const sanitized: AnalyticsParams = {};

  for (const [rawKey, rawValue] of Object.entries(params)) {
    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    const key = VALID_PARAM_NAME.test(rawKey) ? rawKey : null;

    if (!key) {
      continue;
    }

    if (typeof rawValue === "string" || typeof rawValue === "boolean") {
      sanitized[key] = rawValue;
      continue;
    }

    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      sanitized[key] = rawValue;
    }
  }

  return sanitized;
};

const toAnalyticsPayload = (
  params: AnalyticsParams | null | undefined
): AnalyticsParams => {
  if (!isPlainObject(params)) {
    return {};
  }

  if (Object.keys(params).length === 0) {
    return {};
  }

  return { ...params };
};

const logSafely = async (
  eventName: string,
  params?: AnalyticsParams | null
) => {
  try {
    const payload = toAnalyticsPayload(params ?? {});
    await Analytics.logEvent(eventName, payload);
  } catch (error) {
    console.warn(`Failed to log analytics event ${eventName}`, error);
  }
};

export const logLocationOptIn = async (value: boolean): Promise<void> => {
  await logSafely("location_opt_in", { value });
};

export const logLocationDenied = async (): Promise<void> => {
  await logSafely("location_denied");
};

const sanitizeLocationUpdateParams = (
  params: Record<string, unknown>
): AnalyticsParams => {
  const rawPayload: Record<string, unknown> = {};

  const city = params["city"];
  if (typeof city === "string") {
    const trimmedCity = city.trim();

    if (trimmedCity) {
      rawPayload.city = trimmedCity;
    }
  }

  const neighborhood = params["neighborhood"];
  if (typeof neighborhood === "string") {
    const trimmedNeighborhood = neighborhood.trim();

    if (trimmedNeighborhood) {
      rawPayload.neighborhood = trimmedNeighborhood;
    }
  }

  const accuracy = params["accuracy"];
  if (accuracy !== undefined && accuracy !== null) {
    const numericAccuracy = Number(accuracy);

    if (Number.isFinite(numericAccuracy)) {
      rawPayload.accuracy = numericAccuracy;
    }
  }

  return sanitizeAnalyticsParams(rawPayload);
};

export const logLocationUpdate = async (params: unknown): Promise<void> => {
  if (!isPlainObject(params)) {
    await logSafely("location_update", {});
    return;
  }

  const payload = sanitizeLocationUpdateParams(params);
  await logSafely("location_update", payload);
};

export const logNeighborhoodInferred = async (
  neighborhood: string
): Promise<void> => {
  if (!neighborhood) {
    return;
  }

  await logSafely("neighborhood_inferred", { neighborhood });
};

interface LogNewsOpenParams {
  newsId: string;
  priority: string;
  scope: string;
  citySlug: string | null;
  neighborhoodSlug: string | null;
}

export const logNewsOpen = async ({
  newsId,
  priority,
  scope,
  citySlug,
  neighborhoodSlug,
}: LogNewsOpenParams): Promise<void> => {
  const payload: AnalyticsParams = {
    newsId,
    priority,
    scope,
  };

  if (typeof citySlug === "string" && citySlug) {
    payload.citySlug = citySlug;
  }

  if (typeof neighborhoodSlug === "string" && neighborhoodSlug) {
    payload.neighborhoodSlug = neighborhoodSlug;
  }

  await logSafely("news_open", payload);
};

export default {
  logLocationOptIn,
  logLocationDenied,
  logLocationUpdate,
  logNeighborhoodInferred,
  logNewsOpen,
};
