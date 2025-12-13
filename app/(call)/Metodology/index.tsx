import React, { useEffect, useRef } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { HistorySection } from "@/components/metodology/HistorySection";
import { MetodologyHeader } from "@/components/metodology/MetodologyHeader";
import { PointsSection } from "@/components/metodology/PointsSection";
import { ReferralSection } from "@/components/metodology/ReferralSection";
import { SocialModal } from "@/components/metodology/SocialModal";
import { useMetodologyLogic } from "@/hooks/useMetodologyLogic";
import { metodologyStyles as styles } from "@/styles/metodology.styles";
import { platformLabel } from "@/utils/metodologyUtils";

export default function Metodology() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ scrollTo?: string }>();
  const hasScrolledToAnchor = useRef(false);
  const {
    greeting,
    profile,
    progressValue,
    levelDisplay,
    xpToNext,
    referralCode,
    loadingCode,
    sharing,
    redeemInput,
    setRedeemInput,
    redeeming,
    handleGenerateCode,
    handleShareCode,
    handleRedeem,
    POINT_ACTIONS,
    handleActionPress,
    loading,
    availability,
    loadingSocialAvailability,
    hasAwardToday,
    socialModalVisible,
    setSocialModalVisible,
    officialSocialLinks,
    loadingSocialLinks,
    processingPlatform,
    handleSocialLinkPress,
    history,
    renderHistoryLabel,
    formatDate,
    scrollRef,
    setReferralSectionY,
    pointsSectionY,
    setPointsSectionY,
    profileSectionY,
    setProfileSectionY,
  } = useMetodologyLogic();

  useEffect(() => {
    hasScrolledToAnchor.current = false;
  }, [params.scrollTo]);

  useEffect(() => {
    if (hasScrolledToAnchor.current || !scrollRef.current) return;

    const target =
      params.scrollTo === "points"
        ? pointsSectionY
        : params.scrollTo === "profile"
        ? profileSectionY
        : null;

    if (target == null) return;

    const targetY = Math.max(target - 10, 0);
    scrollRef.current.scrollTo({ y: targetY, animated: true });
    hasScrolledToAnchor.current = true;
  }, [params.scrollTo, pointsSectionY, profileSectionY, scrollRef]);
  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        ref={scrollRef}
      >
        <MetodologyHeader
          greeting={greeting}
          profile={profile}
          progressValue={progressValue}
          levelDisplay={levelDisplay}
          xpToNext={xpToNext}
          onLayout={(event) =>
            setProfileSectionY(event.nativeEvent.layout.y ?? null)
          }
        />

        <ReferralSection
          referralCode={referralCode}
          loadingCode={loadingCode}
          sharing={sharing}
          redeemInput={redeemInput}
          redeeming={redeeming}
          onGenerate={handleGenerateCode}
          onShare={handleShareCode}
          onRedeem={handleRedeem}
          onRedeemInputChange={setRedeemInput}
          onLayout={setReferralSectionY}
        />

        <PointsSection
          actions={POINT_ACTIONS}
          loading={loading}
          availability={availability}
          loadingSocialAvailability={loadingSocialAvailability}
          hasAwardToday={hasAwardToday}
          onActionPress={handleActionPress}
          onCatalogPress={() => router.push("/(call)/Metodology/rewards")}
          onLayout={(event) =>
            setPointsSectionY(event.nativeEvent.layout.y ?? null)
          }
        />

        <HistorySection
          history={history}
          loading={loading}
          renderHistoryLabel={renderHistoryLabel}
          formatDate={formatDate}
        />
      </ScrollView>

      <SocialModal
        visible={socialModalVisible}
        onClose={() => setSocialModalVisible(false)}
        officialSocialLinks={officialSocialLinks}
        loadingSocialLinks={loadingSocialLinks}
        loadingSocialAvailability={loadingSocialAvailability}
        hasAwardToday={hasAwardToday}
        processingPlatform={processingPlatform}
        onSocialLinkPress={handleSocialLinkPress}
        platformLabel={platformLabel}
      />
    </>
  );
}
