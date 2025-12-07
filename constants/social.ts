export type SocialPlatform = "instagram" | "tiktok" | "youtube" | "facebook";

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
];

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
};

export const SOCIAL_ID_PLATFORM_MAP: Record<string, SocialPlatform> = {
  instagram: "instagram",
  tiktok: "tiktok",
  youtube: "youtube",
  facebook: "facebook",
};

export const normalizeSocialId = (value: string) => value.trim().toLowerCase();

export const isSocialPlatform = (
  value: string | null | undefined
): value is SocialPlatform =>
  !!value &&
  SOCIAL_PLATFORMS.includes(value.toLowerCase() as SocialPlatform);
