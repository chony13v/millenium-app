import * as Analytics from "expo-firebase-analytics";

const logSafely = async (eventName: string, params?: Record<string, unknown>) => {
  try {
    await Analytics.logEvent(eventName, params ?? {});
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
  accuracy: number | null,
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
  neighborhood: string,
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