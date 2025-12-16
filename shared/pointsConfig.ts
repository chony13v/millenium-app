export type PointsActivityKey =
  | "app_open_daily"
  | "poll_vote"
  | "city_report_created"
  | "weekly_event_attendance"
  | "social_follow"
  | "referral_signup"
  | "streak_bonus"
  | "news_click"
  | "referral_reward_referrer"
  | "referral_reward_redeemer";

export const POINTS_BY_ACTIVITY: Record<PointsActivityKey, number> = {
  app_open_daily: 5,
  poll_vote: 10,
  city_report_created: 10,
  weekly_event_attendance: 50,
  social_follow: 20,
  referral_signup: 100,
  // Este valor representa el bonus base por racha; la lógica de límites se mantiene donde ya existe.
  streak_bonus: 25,
  news_click: 5,
  referral_reward_referrer: 200,
  referral_reward_redeemer: 100,
};

const isDevEnv =
  (typeof __DEV__ !== "undefined" && __DEV__ === true) ||
  process.env.NODE_ENV !== "production";

export const getPointsForActivity = (
  key: string,
  fallback = 0
): number => {
  const value = POINTS_BY_ACTIVITY[key as PointsActivityKey];
  if (typeof value === "number") return value;
  if (isDevEnv) {
    // eslint-disable-next-line no-console
    console.warn(`[points] No points configured for activity "${key}"`);
  }
  return fallback;
};
