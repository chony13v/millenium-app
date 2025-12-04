export type PointsEventType =
  | "app_open_daily"
  | "poll_vote"
  | "social_follow"
  | "city_report_created"
  | "referral_signup"
  | "streak_bonus"
  | "weekly_event_attendance";

export type PointAction = {
  id: string;
  title: string;
  subtitle: string;
  points: number;
  frequency: string;
  eventType: PointsEventType;
};

export const POINT_ACTIONS: PointAction[] = [
  {
    id: "app_open_daily",
    title: "Entrar a Ciudad FC cada día",
    subtitle: "Suma por tu constancia diaria",
    points: 5,
    frequency: "1 vez por día",
    eventType: "app_open_daily",
  },
  {
    id: "poll_vote",
    title: "Responder encuestas",
    subtitle: "Tu voz importa, participa y suma puntos puntos puntos puntos",
    points: 10,
    frequency: "Hasta 3 por día",
    eventType: "poll_vote",
  },
  {
    id: "city_report_created",
    title: "Reportar incidencias",
    subtitle: "Ayuda a mejorar las canchas de tu ciudad",
    points: 30,
    frequency: "Cada 6 horas",
    eventType: "city_report_created",
  },
  {
    id: "weekly_event_attendance",
    title: "Asistencia a eventos municipales gratuitos",
    subtitle: "Registra tu participación en eventos semanales",
    points: 50,
    frequency: "1 vez por evento",
    eventType: "weekly_event_attendance",
  },
  {
    id: "social_follow",
    title: "Seguir redes oficiales",
    subtitle: "Apoya a Ciudad FC en cada plataforma",
    points: 20,
    frequency: "1 vez por plataforma",
    eventType: "social_follow",
  },
  {
    id: "referral_signup",
    title: "Invitar amigos",
    subtitle: "Recibe puntos cuando tu referido se registra",
    points: 100,
    frequency: "Por cada referido aprobado",
    eventType: "referral_signup",
  },
  {
    id: "streak_bonus",
    title: "Bonos por racha",
    subtitle: "Recompensa extra al llegar a hitos",
    points: 0,
    frequency: "Hitos 3, 7, 14, 30 días",
    eventType: "streak_bonus",
  },
];

export const LEVEL_THRESHOLDS = [0, 200, 500, 900, 1400, 2000];

export const getLevelProgress = (total: number) => {
  const levelIndex = LEVEL_THRESHOLDS.findIndex(
    (threshold, idx) =>
      total >= threshold &&
      (LEVEL_THRESHOLDS[idx + 1] === undefined ||
        total < LEVEL_THRESHOLDS[idx + 1])
  );

  const level = Math.max(1, levelIndex === -1 ? 1 : levelIndex + 1);
  const currentBase = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold =
    LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const range = Math.max(1, nextThreshold - currentBase);
  const progress = Math.min(1, Math.max(0, (total - currentBase) / range));
  const xpToNext = Math.max(0, nextThreshold - total);

  return { level, progress, xpToNext, nextThreshold };
};
