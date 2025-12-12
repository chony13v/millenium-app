import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "@clerk/clerk-expo";

import { Colors } from "@/constants/colors";
import { useCitySelection } from "@/hooks/useCitySelection";
import { useFirebaseUid } from "@/hooks/useFirebaseUid";
import { usePointsProfile } from "@/hooks/usePointsProfile";
import { type Reward } from "@/types/rewards";
import { fetchRewardById } from "@/services/rewards/rewards";
import {
  buildRedemptionQrUrl,
  createRedemption,
} from "@/services/rewards/redemptions";

export default function RewardDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    rewardId?: string;
    title?: string;
    merchantName?: string;
    merchantId?: string;
    cost?: string;
    description?: string;
    cityId?: string;
  }>();
  const getParamValue = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;
  const { selectedCity } = useCitySelection();
  const { user } = useUser();
  const { firebaseUid } = useFirebaseUid();
  const {
    profile,
    loading: loadingPoints,
    refreshFromServer,
  } = usePointsProfile(
    firebaseUid,
    user?.primaryEmailAddress?.emailAddress ?? null
  );

  const [reward, setReward] = useState<Reward | null>(null);
  const [loadingReward, setLoadingReward] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRedemption, setLastRedemption] = useState<{
    id: string;
    qrUrl?: string;
  } | null>(null);

  const rewardId = getParamValue(params.rewardId);

  const rewardFromParams = useMemo<Reward | null>(() => {
    if (!rewardId) return null;
    const costNumber = Number(getParamValue(params.cost) ?? 0);
    const title = getParamValue(params.title);
    const merchantName = getParamValue(params.merchantName);
    const merchantId = getParamValue(params.merchantId);
    const description = getParamValue(params.description);
    const cityId = getParamValue(params.cityId);
    return {
      id: rewardId,
      title: title ?? "Recompensa",
      description: description || undefined,
      cost: Number.isFinite(costNumber) ? costNumber : 0,
      merchantId: merchantId ?? "merchant_unknown",
      merchantName: merchantName ?? merchantId ?? "Comercio aliado",
      cityId: cityId || null,
      imageUrl: null,
    };
  }, [
    params.cost,
    params.description,
    params.merchantId,
    params.merchantName,
    params.title,
    rewardId,
    params.cityId,
  ]);

  useEffect(() => {
    if (rewardFromParams && !reward) {
      setReward(rewardFromParams);
      setLoadingReward(false);
    }
  }, [reward, rewardFromParams]);

  useEffect(() => {
    if (!rewardId) {
      setError("No encontramos esta recompensa.");
      setLoadingReward(false);
      return;
    }

    let cancelled = false;
    setLoadingReward(true);
    fetchRewardById(rewardId)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setReward(data);
          setError(null);
        } else if (!rewardFromParams) {
          setError("No encontramos esta recompensa.");
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (!rewardFromParams) setError("No pudimos cargar el detalle.");
      })
      .finally(() => {
        if (!cancelled) setLoadingReward(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rewardFromParams, rewardId]);

  const openQrScreen = (redemptionId: string, qrUrl?: string) => {
    const url = qrUrl || buildRedemptionQrUrl(redemptionId);
    router.push({
      pathname: "/(call)/Metodology/rewards/[rewardId]/coupon",
      params: {
        rewardId: rewardId ?? "",
        redemptionId,
        qrUrl: url,
        rewardTitle: reward?.title ?? "Recompensa",
        merchantName: reward?.merchantName ?? reward?.merchantId ?? "Comercio aliado",
      },
    });
  };

  const handleRedeem = async () => {
    if (!reward || !rewardId) {
      Alert.alert("No disponible", "No encontramos esta recompensa.");
      return;
    }
    if (!firebaseUid) {
      Alert.alert("Inicia sesión", "Necesitas una sesión activa para canjear.");
      return;
    }
    if (profile.total < reward.cost) {
      Alert.alert(
        "Puntos insuficientes",
        `Necesitas ${reward.cost} pts y tienes ${profile.total} pts.`
      );
      return;
    }

    setRedeeming(true);
    try {
      const redemption = await createRedemption({
        rewardId: reward.id,
        merchantId: reward.merchantId,
        cityId: selectedCity ?? null,
        rewardCost: reward.cost,
        rewardTitle: reward.title,
      });
      setLastRedemption({ id: redemption.id, qrUrl: redemption.qrUrl });
      refreshFromServer().catch(() => {});
      Alert.alert("Canje generado", "Tu cupón está listo para validar.", [
        {
          text: "Ver QR",
          onPress: () => openQrScreen(redemption.id, redemption.qrUrl),
        },
        { text: "Cerrar" },
      ]);
    } catch (err) {
      console.warn("[rewards] createRedemption failed", err);
      Alert.alert(
        "No pudimos crear el cupón",
        "Inténtalo nuevamente en unos segundos."
      );
    } finally {
      setRedeeming(false);
    }
  };

  const pointsAvailable = profile.total ?? 0;
  const canRedeem =
    !!reward &&
    !redeeming &&
    !loadingPoints &&
    pointsAvailable >= reward.cost &&
    !!firebaseUid;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de recompensa</Text>
      </View>

      {loadingReward && !reward ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.NAVY_BLUE} />
          <Text style={styles.loadingText}>Cargando recompensa...</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {reward ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["#0f172a", "#1e3a8a"]}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.hero}
          >
            <Text style={styles.heroBadge}>
              {reward.cost} pts · {reward.merchantName || reward.merchantId}
            </Text>
            <Text style={styles.heroTitle}>{reward.title}</Text>
            {reward.description ? (
              <Text style={styles.heroSubtitle}>{reward.description}</Text>
            ) : null}
          </LinearGradient>

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
              <Text style={styles.infoValue}>
                {reward.cityId || "Disponible en tu cuenta"}
              </Text>
            </View>
            <Text style={styles.helperText}>
              Se generará un cupón en estado pendiente con un QR para validación
              del comercio. Tu saldo no se descuenta en esta etapa.
            </Text>
          </View>

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
                    pointsAvailable < reward.cost && { color: "#b91c1c" },
                  ]}
                >
                  {reward.cost} pts
                </Text>
              </View>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!canRedeem || redeeming) && styles.buttonDisabled,
              ]}
              onPress={handleRedeem}
              disabled={!canRedeem || redeeming}
            >
              <Text style={styles.primaryButtonText}>
                {redeeming ? "Generando cupón..." : "Canjear y generar cupón"}
              </Text>
            </TouchableOpacity>

            {lastRedemption ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() =>
                  openQrScreen(lastRedemption.id, lastRedemption.qrUrl)
                }
              >
                <Text style={styles.secondaryButtonText}>Ver QR</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
    padding: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: "#0f172a",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.16)",
    color: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontFamily: "barlow-semibold",
    fontSize: 12,
  },
  heroTitle: {
    color: "white",
    fontFamily: "barlow-semibold",
    fontSize: 20,
    lineHeight: 26,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.92)",
    fontFamily: "barlow-regular",
    fontSize: 14,
    lineHeight: 20,
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
