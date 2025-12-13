import React from "react";
import { Image, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { type UseMetodologyLogicReturn } from "@/hooks/useMetodologyLogic";
import { metodologyStyles as styles } from "@/styles/metodology.styles";

type Props = {
  greeting: string;
  profile: UseMetodologyLogicReturn["profile"];
  progressValue: number;
  levelDisplay: number;
  xpToNext: number;
  onLayout?: (event: any) => void;
};

export const MetodologyHeader: React.FC<Props> = ({
  greeting,
  profile,
  progressValue,
  levelDisplay,
  xpToNext,
  onLayout,
}) => (
  <LinearGradient
    colors={["#1e3a8a", "#1e3a8a"]}
    start={[0, 0]}
    end={[1, 1]}
    style={styles.heroCard}
    onLayout={onLayout}
  >
    <View style={styles.heroTitlePill}>
      <Text style={styles.heroTitle}>Perfil de puntos de {greeting}</Text>
    </View>
    <Text style={styles.heroSubtitle}>
      Suma puntos, mejora tu nivel y desbloquea recompensas como miembro de
      Ciudad FC.
    </Text>
    <View style={styles.sponsorBox}>
      <Image
        source={require("@/assets/images/logo_alcaldiaRiobamba.png")}
        style={styles.sponsorLogo}
        resizeMode="contain"
      />
    </View>
    <View style={styles.heroStatsRow}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Puntos</Text>
        <Text style={styles.statValue}>{profile.total ?? 0}</Text>
        <Text style={styles.statHint}>Balance actual</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Racha</Text>
        <Text style={styles.statValue}>{profile.streakCount ?? 0}</Text>
        <Text style={styles.statHint}>días activo</Text>
      </View>
    </View>

    <View style={styles.progressBar}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.round(progressValue * 100)}%` },
        ]}
      />
    </View>
    <Text style={styles.progressLabel}>
      Nivel {levelDisplay} · quedan {xpToNext} puntos
    </Text>
  </LinearGradient>
);
