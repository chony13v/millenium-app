import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
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
  const [activeTab, setActiveTab] = useState<"rewards" | "catalog" | "transactions">("rewards");
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
    memberSince,
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

  const tabBar = useMemo(
    () => (
      <View style={styles.tabBar}>
        {[
          { key: "rewards", label: "Puntos" },
          { key: "catalog", label: "Premios" },
          { key: "transactions", label: "Transacciones" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab.key as any)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.key && styles.tabButtonTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
    [activeTab]
  );
  return (
    <>
      {activeTab === "catalog" ? (
        <CatalogTab
          tabBar={tabBar}
          contentPaddingBottom={insets.bottom + 20}
        />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 20, gap: 0 },
          ]}
          showsVerticalScrollIndicator={false}
          ref={scrollRef}
        >
          {tabBar}

          {activeTab === "rewards" && (
            <View style={styles.sectionsStack}>
              <MetodologyHeader
                greeting={greeting}
                profile={profile}
                progressValue={progressValue}
                levelDisplay={levelDisplay}
                xpToNext={xpToNext}
                memberSince={memberSince}
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
                streakCount={profile.streakCount ?? 0}
                onLayout={(event) =>
                  setPointsSectionY(event.nativeEvent.layout.y ?? null)
                }
              />
            </View>
          )}

          {activeTab === "transactions" && (
            <View style={styles.sectionsStack}>
              <HistorySection
                history={history}
                loading={loading}
                renderHistoryLabel={renderHistoryLabel}
                formatDate={formatDate}
              />
            </View>
          )}
        </ScrollView>
      )}

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

const CatalogTab: React.FC<{
  tabBar: React.ReactNode;
  contentPaddingBottom: number;
}> = ({ tabBar, contentPaddingBottom }) => (
  <View style={styles.container}>
    <View
      style={[
        styles.content,
        { paddingBottom: contentPaddingBottom, flex: 1 },
      ]}
    >
      {tabBar}
      <View style={styles.catalogContainer}>
        <Text style={styles.sectionTitle}>Catálogo</Text>
      </View>
    </View>
  </View>
);
