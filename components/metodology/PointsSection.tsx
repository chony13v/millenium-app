import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { type PointAction } from "@/constants/points";
import { type UseMetodologyLogicReturn } from "@/hooks/useMetodologyLogic";
import { metodologyStyles as styles } from "@/styles/metodology.styles";
import { ConfettiBurst } from "./ConfettiBurst";

const ACTION_ICONS: Record<
  PointAction["id"],
  keyof typeof MaterialIcons.glyphMap
> = {
  app_open_daily: "event-available",
  poll_vote: "poll",
  city_report_created: "report-problem",
  weekly_event_attendance: "event-note",
  social_follow: "group",
  referral_signup: "person-add-alt",
  streak_bonus: "whatshot",
};

export type PointsSectionProps = {
  actions: readonly PointAction[];
  loading: boolean;
  availability: UseMetodologyLogicReturn["availability"];
  loadingSocialAvailability: boolean;
  hasAwardToday: UseMetodologyLogicReturn["hasAwardToday"];
  onActionPress: (action: PointAction) => void;
  onCatalogPress?: () => void;
  onLayout?: (event: any) => void;
  streakCount?: number;
};

export const PointsSection: React.FC<PointsSectionProps> = ({
  actions,
  loading,
  availability: _availability,
  loadingSocialAvailability,
  hasAwardToday: _hasAwardToday,
  onActionPress,
  onCatalogPress,
  onLayout,
  streakCount,
}) => {
  const [confettiKey, setConfettiKey] = React.useState(0);

  const handleStreakPress = () => {
    setConfettiKey((prev) => prev + 1);
  };

  return (
    <View style={styles.sectionPlain} onLayout={onLayout}>
      <ConfettiBurst
        runKey={confettiKey}
        colors={["#007BFF", "#FF0000"]}
        onComplete={() => setConfettiKey(0)}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Cómo ganar puntos</Text>
        <TouchableOpacity
          onPress={onCatalogPress}
          activeOpacity={0.9}
          style={styles.catalogPillButton}
        >
          <Text style={styles.catalogPill}>🎁 Premios</Text>
        </TouchableOpacity>
      </View>

      {typeof streakCount === "number" && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.streakPillRow}
          accessibilityLabel={`Racha de ${streakCount} días`}
          onPress={handleStreakPress}
        >
          <Text style={styles.streakPillLabel}>🔥 Racha</Text>
          <Text style={styles.streakPillValue}>{streakCount} días</Text>
        </TouchableOpacity>
      )}

      {actions.map((action) => {
        const isSocialAction = action.eventType === "social_follow";
        const iconName = ACTION_ICONS[action.id] ?? "check-circle";
        return (
          <View key={action.id}>
            <TouchableOpacity
              style={[
                styles.actionCard,
                styles.actionCardPlain,
              ]}
              disabled={
                loading ||
                (isSocialAction && (loadingSocialAvailability || loading))
              }
              onPress={() => onActionPress(action)}
              accessibilityLabel={`Acción: ${action.title}`}
            >
              <View style={styles.actionHeader}>
                <View style={styles.actionIconBadge}>
                  <MaterialIcons name={iconName} size={34} color="#0f1f4b" />
                </View>
                <View style={styles.actionTextCol}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  <Text
                    style={[
                      styles.actionFrequency,
                      styles.actionFrequencyInline,
                    ]}
                  >
                    {action.frequency}
                  </Text>
                </View>
                <View style={styles.actionPointsWrap}>
                  <Text style={styles.actionPoints}>+{action.points} pts</Text>
                  <LinearGradient
                    colors={["#0f1f4b", "#ef4444"]}
                    start={[0, 0.5]}
                    end={[1, 0.5]}
                    style={styles.actionPointUnderline}
                  />
                  <LinearGradient
                    colors={["#0f1f4b", "#ef4444"]}
                    start={[0, 0.5]}
                    end={[1, 0.5]}
                    style={[
                      styles.actionPointUnderline,
                      styles.actionPointUnderlineSecondary,
                    ]}
                  />
                </View>
              </View>
              <View style={styles.actionFooter}>
                <View style={styles.actionFooterSpacer} />
                <Text
                  style={[
                    styles.statusBadge,
                    styles.statusBadgeRaised,
                    styles.badgeAvailable,
                  ]}
                >
                  Disponible
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};
