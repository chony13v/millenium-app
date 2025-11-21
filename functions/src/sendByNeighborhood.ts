import * as Analytics from "expo-firebase-analytics";

type AnalyticsParams = Record<string, string | number>;

const sanitizeParams = (params?: Record<string, unknown>): AnalyticsParams => {
  if (!params) {
    return {};
  }

  const sanitizedEntries = Object.entries(params).reduce<
    Array<[string, string | number]>
  >((entries, [key, value]) => {
    if (value === undefined || value === null) {
      return entries;
    }

    if (typeof value === "number") {
      if (Number.isFinite(value)) {
        entries.push([key, value]);
      }
      return entries;
    }

    entries.push([key, String(value)]);
    return entries;
  }, []);

  if (sanitizedEntries.length === 0) {
    return {};
  }

  return Object.fromEntries(sanitizedEntries);
};

const logSafely = async (
  eventName: string,
  params?: Record<string, unknown>
) => {
  try {
    const sanitized = sanitizeParams(params);
    await Analytics.logEvent(eventName, sanitized);
  } catch (error) {
    console.warn(`Failed to log analytics event ${eventName}`, error);
  }
};

export const logLocationOptIn = async (value: boolean): Promise<void> => {
  await logSafely("location_opt_in", { value });
};

export const logLocationUpdate = async (
  city: string | null,
  neighborhood: string | null,
  accuracy: number | null
): Promise<void> => {
  const payload: Record<string, unknown> = {
    city: city ?? "unknown",
    neighborhood: neighborhood ?? "unknown",
  };

  if (typeof accuracy === "number") {
    payload.accuracy = accuracy;
  }

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

export default {
  logLocationOptIn,
  logLocationUpdate,
  logNeighborhoodInferred,
};
