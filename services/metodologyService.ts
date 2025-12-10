import { awardPointsEvent } from "@/services/points/awardPoints";
import {
  awardSocialEngagement,
  logSocialClick,
} from "@/services/points/socialEngagement";
import {
  ensureReferralCode,
  fetchReferralCode,
  redeemReferralCode,
} from "@/services/referrals";
import { type OfficialSocialLink } from "@/hooks/useOfficialSocialLinks";
import { type PointAction } from "@/constants/points";

export const loadReferralCode = async (firebaseUid?: string | null) => {
  if (!firebaseUid) return null;
  return fetchReferralCode(firebaseUid);
};

export const ensureReferralCodeForUser = async (
  firebaseUid?: string | null
) => {
  const ensured = await ensureReferralCode();
  if (ensured) return ensured;
  return loadReferralCode(firebaseUid);
};

export const redeemCode = (code: string) => redeemReferralCode(code.trim());

export const awardActionEvent = async (
  action: PointAction,
  userId: string | null,
  metadata?: Record<string, unknown>
) =>
  awardPointsEvent({
    eventType: action.eventType,
    userId: userId ?? undefined,
    metadata,
  });

export const recordSocialClick = async (
  firebaseUid: string,
  link: OfficialSocialLink
) => {
  try {
    await logSocialClick(firebaseUid, link.linkId, link.platform);
  } catch {
    // best effort tracking
  }
};

export const awardSocialLinkEngagement = (link: OfficialSocialLink) =>
  awardSocialEngagement({ linkId: link.linkId, platform: link.platform });
