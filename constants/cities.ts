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
