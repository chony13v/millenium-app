import { Platform } from "react-native";

import {
  type SocialPlatform,
  SOCIAL_PLATFORM_LABELS,
} from "@/constants/social";

export type ReferralLinkConfig = {
  playStoreUrl?: string;
  appStoreUrl?: string;
  appDlBaseUrl?: string;
};

export const buildReferralLink = (
  code: string,
  { playStoreUrl, appStoreUrl, appDlBaseUrl }: ReferralLinkConfig
) => {
  const base =
    Platform.OS === "android"
      ? playStoreUrl || appDlBaseUrl
      : appStoreUrl || appDlBaseUrl || playStoreUrl;
  const safeBase = base || appDlBaseUrl || "https://ciudadfc.app";
  const linkType =
    safeBase === playStoreUrl || safeBase === appStoreUrl ? "store" : "dynamic";
  const separator = safeBase.includes("?") ? "&" : "?";
  const url = `${safeBase}${separator}utm_source=share&utm_medium=referral&utm_campaign=referral_code&utm_content=${encodeURIComponent(
    code
  )}`;
  return { url, linkType };
};

export const platformLabel = (platform: SocialPlatform) =>
  SOCIAL_PLATFORM_LABELS[platform] || platform;

export const renderHistoryLabel = (eventType: string) => {
  const base = eventType.split(":")[0];
  switch (base) {
    case "app_open_daily":
      return "Entrada diaria";
    case "poll_vote":
      return "Respuesta de encuesta";
    case "city_report_created":
      return "Reporte ciudadano";
    case "weekly_event_attendance":
      return "Asistencia a evento gratuito";
    case "social_follow":
      return "Sigue redes Ciudad FC";
    case "referral_signup":
      return "Invitación aprobada";
    case "referral_reward":
      return "Recompensa por referido";
    case "referral_redeem":
      return "Canje de referido";
    case "streak_bonus":
      return "Bono por racha";
    default:
      return eventType;
  }
};

export const formatDate = (date?: Date) => {
  if (!date) return "Sin fecha";
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};
