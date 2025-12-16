import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

import { HistorySection } from "@/components/metodology/HistorySection";
import { MetodologyHeader } from "@/components/metodology/MetodologyHeader";
import { PointsSection } from "@/components/metodology/PointsSection";
import { ReferralSection } from "@/components/metodology/ReferralSection";
import { SocialModal } from "@/components/metodology/SocialModal";
import { ConfettiBurst } from "@/components/metodology/ConfettiBurst";
import { useMetodologyLogic } from "@/hooks/useMetodologyLogic";
import { metodologyStyles as styles } from "@/styles/metodology.styles";
import { platformLabel } from "@/utils/metodologyUtils";
import RewardsCatalogScreen from "./rewards";

type TabKey = "rewards" | "catalog" | "transactions";

export default function Metodology() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ scrollTo?: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>("rewards");
  const hasScrolledToAnchor = useRef(false);
  const shouldScrollToTop = useRef(false);
  const currentOffsetY = useRef(0);
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
    confettiKey,
    handleConfettiComplete,
  } = useMetodologyLogic();

  useEffect(() => {
    hasScrolledToAnchor.current = false;
  }, [params.scrollTo]);

  const scrollToTopIfNeeded = useCallback(() => {
    if (activeTab === "catalog") return true;
    if (currentOffsetY.current <= 2) return true;
    const scrollView = scrollRef.current;
    if (!scrollView) return false;
    Keyboard.dismiss();
    scrollView.scrollTo({ y: 0, animated: true });
    return true;
  }, [activeTab, scrollRef]);

  const requestScrollToTop = useCallback(
    (tab: TabKey) => {
      if (tab === "catalog") return;
      shouldScrollToTop.current = true;
      const attempt = () => {
        if (scrollToTopIfNeeded()) {
          shouldScrollToTop.current = false;
          return;
        }
        requestAnimationFrame(attempt);
      };
      setTimeout(attempt, 80);
    },
    [scrollToTopIfNeeded]
  );

  const handleTabPress = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab);
      requestScrollToTop(tab);
    },
    [requestScrollToTop]
  );

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

  useEffect(() => {
    if (!shouldScrollToTop.current) return;
    if (activeTab === "catalog") {
      shouldScrollToTop.current = false;
      return;
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
    shouldScrollToTop.current = false;
  }, [activeTab, scrollRef]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const timeout = setTimeout(() => {
        if (!isActive) return;
        const attempt = () => {
          if (!isActive) return;
          if (scrollToTopIfNeeded()) return;
          requestAnimationFrame(attempt);
        };
        attempt();
      }, 80);
      return () => {
        isActive = false;
        clearTimeout(timeout);
      };
    }, [scrollToTopIfNeeded])
  );

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
            onPress={() => handleTabPress(tab.key as TabKey)}
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
    [activeTab, handleTabPress]
  );
  return (
    <>
      <ConfettiBurst
        runKey={confettiKey}
        colors={["#16A34A", "#FFFFFF"]}
        onComplete={handleConfettiComplete}
      />
      {activeTab === "catalog" ? (
        <CatalogTab
          tabBar={tabBar}
          contentPaddingBottom={insets.bottom + 20}
          onBackToRewards={() => handleTabPress("rewards")}
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
          onScroll={(event) => {
            currentOffsetY.current = event.nativeEvent.contentOffset?.y ?? 0;
          }}
          scrollEventThrottle={16}
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
                onCatalogPress={() => handleTabPress("catalog")}
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
  onBackToRewards: () => void;
}> = ({ tabBar, contentPaddingBottom, onBackToRewards }) => (
  <View style={[styles.container, { paddingBottom: contentPaddingBottom }]}>
    <View style={[styles.content, { paddingBottom: 0 }]}>{tabBar}</View>
    <View style={{ flex: 1 }}>
      <RewardsCatalogScreen onBack={onBackToRewards} />
    </View>
  </View>
);
