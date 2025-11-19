export type AnalyticsSafeValue = string | number | boolean;
export type AnalyticsSafeParams = Record<string, AnalyticsSafeValue>;

const normalizeValue = (
  value: unknown,
  fallback: string
): AnalyticsSafeValue => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      return value;
    }
    return 0;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
};

export const safeAnalyticsParams = (
  params: Record<string, unknown> | null | undefined,
  options: { fallbackValue?: string } = {}
): AnalyticsSafeParams => {
  const fallbackValue = options.fallbackValue ?? "unknown";

  if (!params || typeof params !== "object") {
    return {};
  }

  const sanitized: AnalyticsSafeParams = {};

  for (const [key, value] of Object.entries(params)) {
    if (!key) {
      continue;
    }

    sanitized[key] = normalizeValue(value, fallbackValue);
  }

  return sanitized;
};
