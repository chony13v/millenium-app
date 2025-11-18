import { slugify } from "@/src/utils/geo";
export const CITY_OPTIONS = [
  {
    id: "bgr",
    title: "BGR",
    description: "Talento emergente listo para brillar en cada torneo.",
    gradient: ["#1d4ed8", "#38bdf8"],
  },
  {
    id: "riobamba",
    title: "Riobamba",
    description: "La ciudad jardín que vibra con el fútbol formativo.",
    gradient: ["#7c3aed", "#a855f7"],
  },
  {
    id: "manabi",
    title: "Manabí",
    description: "Capital del sol y sede principal de la academia.",
    gradient: ["#22c55e", "#86efac"],
  },
] as const;

export type CityOption = (typeof CITY_OPTIONS)[number];

export type CityId = CityOption["id"];

const CITY_IDS = new Set<CityId>(CITY_OPTIONS.map((option) => option.id));

export const isCityId = (value: unknown): value is CityId => {
  if (typeof value !== "string") {
    return false;
  }

  return CITY_IDS.has(value as CityId);
};

export const CITY_INFO_BY_ID: Record<CityId, CityOption> = CITY_OPTIONS.reduce(
  (accumulator, option) => {
    accumulator[option.id] = option;
    return accumulator;
  },
  {} as Record<CityId, CityOption>
);

export const CITY_SLUG_BY_ID: Record<CityId, string> = CITY_OPTIONS.reduce(
  (accumulator, option) => {
    const inferredSlug = slugify(option.title) ?? option.id;
    accumulator[option.id] = inferredSlug;
    return accumulator;
  },
  {} as Record<CityId, string>
);
export const CITY_ID_BY_SLUG: Record<string, CityId> = CITY_OPTIONS.reduce(
  (accumulator, option) => {
    const normalizedSlug = slugify(option.title);
    if (normalizedSlug) {
      accumulator[normalizedSlug] = option.id;
    }
    accumulator[option.id] = option.id;
    return accumulator;
  },
  {} as Record<string, CityId>
);

export const getCitySlugById = (
  cityId: CityId | null | undefined
): string | null => {
  if (!cityId) {
    return null;
  }

  return CITY_SLUG_BY_ID[cityId] ?? null;
};

export const getCityIdBySlug = (
  slug: string | null | undefined
): CityId | null => {
  if (!slug) {
    return null;
  }

  const normalized = slugify(slug);
  if (!normalized) {
    return null;
  }

  return CITY_ID_BY_SLUG[normalized] ?? null;
};