import { getPointsForActivity } from "../../shared/pointsConfig";

export const LEVEL_THRESHOLDS = [0, 200, 500, 900, 1400, 2000];
export const WEEKLY_EVENT_POINTS = getPointsForActivity(
  "weekly_event_attendance",
  50
);
export const EVENT_TYPE = "weekly_event_attendance";
export const REFERRAL_CODE_LENGTH = 8;
export const REFERRAL_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const REFERRER_REWARD_POINTS = getPointsForActivity(
  "referral_reward_referrer",
  200
);
export const REDEEMER_REWARD_POINTS = getPointsForActivity(
  "referral_reward_redeemer",
  100
);
export const REFERRER_MONTHLY_CAP = 50;
export const REFERRAL_MAX_REDEMPTIONS_PER_CODE = 500;
export const SOCIAL_ENGAGEMENT_POINTS = getPointsForActivity(
  "social_follow",
  20
);
export const NEWS_CLICK_POINTS = getPointsForActivity("news_click", 5);

export const SOCIAL_PLATFORMS = ["instagram", "tiktok", "youtube", "facebook"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_LINK_WHITELIST: Record<string, { platform: SocialPlatform; title: string }> = {
  instagram: { platform: "instagram", title: "Instagram oficial" },
  tiktok: { platform: "tiktok", title: "TikTok oficial" },
  youtube: { platform: "youtube", title: "YouTube oficial" },
  facebook: { platform: "facebook", title: "Facebook oficial" },
};
