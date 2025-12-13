import React from "react";
import { Text, TouchableOpacity, View, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { Colors } from "@/constants/colors";

import { type Reward } from "@/types/rewards";

export const RewardDetailHeader = ({ onBack }: { onBack: () => void }) => (
  <View style={styles.header}>
    <TouchableOpacity
      onPress={onBack}
      style={styles.backButton}
      accessibilityLabel="Volver"
    >
      <Ionicons name="chevron-back" size={22} color="#0f172a" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Detalle de recompensa</Text>
  </View>
);

export const RewardHero = ({ reward }: { reward: Reward }) => (
  <View style={styles.hero}>
    {reward.imageUrl ? (
      <Image source={{ uri: reward.imageUrl }} style={styles.heroImage} />
    ) : null}
    <LinearGradient
      colors={["rgba(15,23,42,0.9)", "rgba(30,58,138,0.7)"]}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.heroOverlay}
    >
      <Text style={styles.heroBadge}>
        {reward.cost} pts · {reward.merchantName || reward.merchantId}
      </Text>
      <Text style={styles.heroTitle}>{reward.title}</Text>
      {reward.description ? (
        <Text style={styles.heroSubtitle}>{reward.description}</Text>
      ) : null}
    </LinearGradient>
  </View>
);

export const RedemptionInfoCard = ({
  reward,
  cityLabel,
  remaining,
  isLimited,
  soldOut,
}: {
  reward: Reward;
  cityLabel: string;
  remaining?: number | null;
  isLimited?: boolean;
  soldOut?: boolean;
}) => (
  <View style={styles.infoCard}>
    <Text style={styles.sectionTitle}>Detalles del canje</Text>
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Comercio:</Text>
      <Text style={styles.infoValue}>
        {reward.merchantName || reward.merchantId}
      </Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Costo:</Text>
      <Text style={styles.infoValue}>{reward.cost} pts</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Ciudad:</Text>
      <Text style={styles.infoValue}>{cityLabel}</Text>
    </View>
    {isLimited ? (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Cupos:</Text>
        <Text
          style={[styles.infoValue, soldOut && { color: "#b91c1c" }]}
        >
          {soldOut ? "Agotada" : `${remaining ?? 0} disponibles`}
        </Text>
      </View>
    ) : null}
  </View>
);

export const PointsBalanceCard = ({
  pointsAvailable,
  rewardCost,
}: {
  pointsAvailable: number;
  rewardCost: number;
}) => (
  <View style={styles.infoCard}>
    <Text style={styles.sectionTitle}>Tu saldo</Text>
    <View style={styles.pointsRow}>
      <View>
        <Text style={styles.infoLabel}>Puntos disponibles</Text>
        <Text style={styles.pointsValue}>{pointsAvailable} pts</Text>
      </View>
      <View>
        <Text style={styles.infoLabel}>Requiere</Text>
        <Text
          style={[
            styles.pointsValue,
            pointsAvailable < rewardCost && { color: "#b91c1c" },
          ]}
        >
          {rewardCost} pts
        </Text>
      </View>
    </View>
  </View>
);

export const PendingRedemptionAlert = ({
  statusLabel,
  createdAtLabel,
  expiresAtLabel,
}: {
  statusLabel: string;
  createdAtLabel: string;
  expiresAtLabel: string;
}) => (
  <View style={styles.pendingAlert}>
    <Text style={styles.pendingAlertTitle}>Cupón pendiente</Text>
    <View style={styles.pendingBody}>
      <Text style={styles.pendingEmoji}>🎟️</Text>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={styles.pendingHighlight}>
          ¡Tienes un cupón activo para este comercio!
        </Text>
        <Text style={styles.pendingAlertText}>
          Toca <Text style={styles.pendingBold}>“Ver QR”</Text> y muéstralo al
          personal para validar tu canje.
        </Text>
        <Text style={styles.pendingAlertText}>
          Al marcarlo como <Text style={styles.pendingBold}>canjeado</Text>,
          podrás generar otro. Vence en{" "}
          <Text style={styles.pendingBold}>30 días</Text> desde su creación.
        </Text>
      </View>
    </View>
    <Text style={styles.pendingStatus}>Estado: {statusLabel}</Text>
    <Text style={styles.pendingDates}>
      Creado: {createdAtLabel} · Expira: {expiresAtLabel}
    </Text>
  </View>
);

export const RewardActions = ({
  onRedeem,
  onViewQr,
  primaryButtonText,
  disabled,
  showViewQr,
}: {
  onRedeem: () => void;
  onViewQr?: () => void;
  primaryButtonText: string;
  disabled: boolean;
  showViewQr: boolean;
}) => (
  <View style={{ gap: 10 }}>
    <TouchableOpacity
      style={[styles.primaryButton, disabled && styles.buttonDisabled]}
      onPress={onRedeem}
      disabled={disabled}
    >
      <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
    </TouchableOpacity>

    {showViewQr && onViewQr ? (
      <TouchableOpacity style={styles.secondaryButton} onPress={onViewQr}>
        <Text style={styles.secondaryButtonText}>Ver QR</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "barlow-semibold",
    fontSize: 18,
    color: "#0f172a",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontFamily: "barlow-medium",
    color: "#334155",
  },
  errorText: {
    paddingHorizontal: 16,
    color: "#b91c1c",
    fontFamily: "barlow-medium",
  },
  hero: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0f172a",
    shadowColor: "#0f172a",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    minHeight: 180,
  },
  heroImage: {
    width: "100%",
    height: 200,
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    padding: 16,
    gap: 8,
    justifyContent: "flex-end",
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: "flex-start",
    fontFamily: "barlow-semibold",
    fontSize: 13,
    color: "white",
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontFamily: "barlow-semibold",
    fontSize: 22,
    color: "white",
  },
  heroSubtitle: {
    fontFamily: "barlow-regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.92)",
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "barlow-semibold",
    fontSize: 16,
    color: "#0f172a",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontFamily: "barlow-medium",
    color: "#475569",
    fontSize: 13,
  },
  infoValue: {
    fontFamily: "barlow-semibold",
    color: "#0f172a",
    fontSize: 13,
  },
  helperText: {
    fontFamily: "barlow-regular",
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
  },
  pointsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  pointsValue: {
    fontFamily: "barlow-semibold",
    fontSize: 18,
    color: Colors.NAVY_BLUE,
  },
  pendingAlert: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#0b1224",
    gap: 4,
    shadowColor: "#0f172a",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  pendingAlertTitle: {
    fontFamily: "barlow-semibold",
    color: "white",
    fontSize: 15,
  },
  pendingAlertText: {
    fontFamily: "barlow-regular",
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    lineHeight: 18,
  },
  pendingStatus: {
    fontFamily: "barlow-medium",
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  pendingDates: {
    fontFamily: "barlow-medium",
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  pendingBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  pendingEmoji: {
    fontSize: 20,
  },
  pendingHighlight: {
    fontFamily: "barlow-semibold",
    color: "white",
    fontSize: 14,
  },
  pendingBold: {
    fontFamily: "barlow-semibold",
    color: "white",
  },
  primaryButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontFamily: "barlow-semibold",
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: "#0f172a",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "white",
    fontFamily: "barlow-semibold",
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

// Optional default export to satisfy route warnings (the file is used as a component library)
export default {};
