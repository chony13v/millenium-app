import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Easing, Image, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { type UseMetodologyLogicReturn } from "@/hooks/useMetodologyLogic";
import { metodologyStyles as styles } from "@/styles/metodology.styles";
import { CircularPointsRing } from "./CircularPointsRing";

type Props = {
  greeting: string;
  profile: UseMetodologyLogicReturn["profile"];
  progressValue: number;
  levelDisplay: number;
  xpToNext: number;
  onLayout?: (event: any) => void;
  memberSince: Date | null;
};

export const MetodologyHeader: React.FC<Props> = ({
  greeting,
  profile,
  progressValue,
  levelDisplay,
  xpToNext,
  memberSince,
  onLayout,
}) => {
  const [showLevelToast, setShowLevelToast] = useState(false);
  const levelAnim = useRef(new Animated.Value(0)).current;
  const prevLevelRef = useRef(levelDisplay);
  const ringSize = useMemo(() => {
    const { width } = Dimensions.get("window");
    return Math.min(width * 0.7, 320);
  }, []);
  const redeemable = profile.total ?? 0;
  const redeemableDisplay = useMemo(
    () => redeemable.toLocaleString("es-EC"),
    [redeemable]
  );
  const memberSinceDisplay = useMemo(() => {
    if (!memberSince) return "Sin fecha";
    const safeDate = memberSince instanceof Date ? memberSince : new Date(memberSince);
    if (Number.isNaN(safeDate.getTime())) return "Sin fecha";
    return safeDate.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [memberSince]);

  useEffect(() => {
    if (levelDisplay > prevLevelRef.current) {
      setShowLevelToast(true);
      levelAnim.setValue(0);
      Animated.sequence([
        Animated.timing(levelAnim, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.delay(500),
        Animated.timing(levelAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => setShowLevelToast(false));
    }
    prevLevelRef.current = levelDisplay;
  }, [levelAnim, levelDisplay]);

  const toastScale = levelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });
  const toastOpacity = levelAnim.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0, 1, 0],
  });

  return (
    <LinearGradient
      colors={["#1e3a8a", "#1e3a8a"]}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.heroCard}
      onLayout={onLayout}
    >
      <Text style={styles.heroName}>{greeting}</Text>
      <View style={styles.pointsRingWrapper}>
        {showLevelToast && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.levelUpToast,
              {
                opacity: toastOpacity,
                transform: [{ scale: toastScale }],
              },
            ]}
          >
            <Text style={styles.levelUpIcon}>🏅</Text>
            <Text style={styles.levelUpText}>Nivel {levelDisplay} desbloqueado</Text>
          </Animated.View>
        )}
        <CircularPointsRing
          progress={progressValue}
          size={ringSize}
          strokeWidth={20}
          dotCount={32}
          colors={{
            track: "#ffffff",
            progress: "#b51224",
            dotActive: "#ffffff",
            dotInactive: "rgba(255,255,255,0.22)",
            background: "rgba(255,255,255,0.02)",
          }}
          title="PUNTOS REDIMIBLES"
          valueText={redeemableDisplay}
          showDots={false}
        />
        <Text style={styles.progressLabel}>
          Nivel {levelDisplay} · faltan {xpToNext} puntos para el siguiente
          nivel
        </Text>
        <Text style={styles.ringHint}>Miembro desde: {memberSinceDisplay}</Text>
      </View>
      <View style={styles.sponsorBox}>
        <Image
          source={require("@/assets/images/logo_alcaldiaRiobamba.png")}
          style={styles.sponsorLogo}
          resizeMode="contain"
        />
      </View>
    </LinearGradient>
  );
};
