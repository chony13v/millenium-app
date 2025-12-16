import React from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

import { type PointAction } from "@/constants/points";
import { type UseMetodologyLogicReturn } from "@/hooks/useMetodologyLogic";
import { metodologyStyles as styles } from "@/styles/metodology.styles";

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
  availability,
  loadingSocialAvailability,
  hasAwardToday,
  onActionPress,
  onCatalogPress,
  onLayout,
  streakCount,
}) => {
  const [confettiKey, setConfettiKey] = React.useState(0);
  const { width, height } = Dimensions.get("window");

  const handleStreakPress = () => {
    setConfettiKey((prev) => prev + 1);
  };

  return (
    <View style={styles.sectionCard} onLayout={onLayout}>
      {confettiKey > 0 && (
        <ConfettiCannon
          key={`streak-confetti-${confettiKey}`}
          autoStart
          fadeOut
          count={60}
          origin={{ x: width / 2, y: height }}
          colors={["#007BFF", "#FF0000"]}
          onAnimationEnd={() => setConfettiKey(0)}
        />
      )}

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
      <Text style={styles.sectionSubtitle}>
        Acciones disponibles y su elegibilidad. La validación final la hace el
        backend para evitar duplicados.
      </Text>
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
        const isSocialBlocked = Object.values(hasAwardToday).every(
          (status) => status === "blocked"
        );
        const isBlocked = isSocialAction
          ? isSocialBlocked
          : availability[action.eventType] === "blocked";
        return (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionCard, isBlocked && styles.actionCardDisabled]}
            disabled={
              loading ||
              isBlocked ||
              (isSocialAction && (loadingSocialAvailability || loading))
            }
            onPress={() => onActionPress(action)}
            accessibilityLabel={`Acción: ${action.title}`}
          >
            <View style={styles.actionHeader}>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>
              <Text style={styles.actionPoints}>+{action.points} pts</Text>
            </View>
            <View style={styles.actionFooter}>
              <Text style={styles.actionFrequency}>{action.frequency}</Text>
              <Text
                style={[
                  styles.statusBadge,
                  isBlocked ? styles.badgeBlocked : styles.badgeAvailable,
                ]}
              >
                {isBlocked ? "No disponible" : "Disponible"}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
