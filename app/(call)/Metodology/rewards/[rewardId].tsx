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
import { doc, onSnapshot } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "@clerk/clerk-expo";

import { db } from "@/config/FirebaseConfig";
import { Colors } from "@/constants/colors";
import { CITY_INFO_BY_ID, type CityId } from "@/constants/cities";
import { useCitySelection } from "@/hooks/useCitySelection";
import { useFirebaseUid } from "@/hooks/useFirebaseUid";
import { usePointsProfile } from "@/hooks/usePointsProfile";
import { type Redemption, type Reward } from "@/types/rewards";
import { fetchRewardById } from "@/services/rewards/rewards";
import {
  buildRedemptionQrUrl,
  createRedemption,
  fetchLatestRedemptionForReward,
} from "@/services/rewards/redemptions";

type LastRedemptionInfo = Pick<
  Redemption,
  "id" | "status" | "qrUrl" | "createdAt"
> & { createdAtDate?: Date | null };

const getStatusLabel = (status?: Redemption["status"]) => {
  switch (status) {
    case "redeemed":
      return "canjeado";
    case "validated":
      return "validado";
    case "rejected":
      return "rechazado";
    case "expired":
      return "expirado";
    default:
      return "pendiente";
  }
};

const formatDateShort = (date?: Date | null) => {
  if (!date) return "Sin fecha";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
};

const getCityLabel = (rewardCityId?: string | null, userCityId?: string | null) => {
  const effectiveCity = rewardCityId || userCityId;
  if (!effectiveCity) return "Sin ciudad";
  const cityInfo = CITY_INFO_BY_ID[effectiveCity as CityId];
  return cityInfo?.title ?? effectiveCity;
};

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
  const [lastRedemption, setLastRedemption] =
    useState<LastRedemptionInfo | null>(null);
  const [loadingLastRedemption, setLoadingLastRedemption] = useState(true);

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

  useEffect(() => {
    let cancelled = false;

    if (!firebaseUid || !rewardId) {
      setLastRedemption(null);
      setLoadingLastRedemption(false);
      return;
    }

    setLoadingLastRedemption(true);
    fetchLatestRedemptionForReward(firebaseUid, rewardId)
      .then((redemption) => {
        if (cancelled) return;
        if (redemption && redemption.status !== "redeemed") {
          const createdAtDate =
            redemption.createdAt && "toDate" in redemption.createdAt
              ? redemption.createdAt.toDate()
              : null;
          setLastRedemption({
            id: redemption.id,
            status: redemption.status,
            qrUrl: redemption.qrUrl,
            createdAt: redemption.createdAt ?? null,
            createdAtDate,
          });
        } else {
          setLastRedemption(null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[rewards] No se pudo cargar canje previo", err);
      })
      .finally(() => {
        if (!cancelled) setLoadingLastRedemption(false);
      });

    return () => {
      cancelled = true;
    };
  }, [firebaseUid, rewardId]);

  useEffect(() => {
    if (!lastRedemption || lastRedemption.status === "redeemed") return;

    const redemptionRef = doc(db, "redemptions", lastRedemption.id);
    const unsub = onSnapshot(
      redemptionRef,
      (snap) => {
        if (!snap.exists()) {
          setLastRedemption(null);
          return;
        }
        const data = snap.data() as Partial<Redemption>;
        const createdAtDate =
          data.createdAt && "toDate" in data.createdAt
            ? data.createdAt.toDate()
            : lastRedemption?.createdAtDate ?? null;
        setLastRedemption((prev) => ({
          id: snap.id,
          status:
            (data.status as Redemption["status"]) ?? prev?.status ?? "pending",
          qrUrl: data.qrUrl ?? prev?.qrUrl ?? "",
          createdAt: data.createdAt ?? prev?.createdAt ?? null,
          createdAtDate,
        }));
      },
      (err) => console.warn("[rewards] No se pudo escuchar canje", err)
    );

    return () => unsub();
  }, [lastRedemption?.id, lastRedemption?.status]);

  const openQrScreen = (redemptionId: string, qrUrl?: string) => {
    const url = qrUrl || buildRedemptionQrUrl(redemptionId);
    router.push({
      pathname: "/(call)/Metodology/rewards/[rewardId]/coupon",
      params: {
        rewardId: rewardId ?? "",
        redemptionId,
        qrUrl: url,
        rewardTitle: reward?.title ?? "Recompensa",
        merchantName:
          reward?.merchantName ?? reward?.merchantId ?? "Comercio aliado",
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
      setLastRedemption({
        id: redemption.id,
        status: redemption.status,
        qrUrl: redemption.qrUrl,
        createdAt: redemption.createdAt ?? null,
        createdAtDate: new Date(),
      });
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
  const hasActiveRedemption =
    !!lastRedemption && lastRedemption.status !== "redeemed";
  const redemptionStatusLabel = getStatusLabel(lastRedemption?.status);
  const redemptionCreatedAt = lastRedemption?.createdAtDate ?? null;
  const redemptionExpiresAt = redemptionCreatedAt
    ? new Date(redemptionCreatedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;
  const cityLabel = getCityLabel(reward?.cityId ?? null, selectedCity);
  const canRedeem =
    !!reward &&
    !redeeming &&
    !loadingPoints &&
    !loadingLastRedemption &&
    !hasActiveRedemption &&
    pointsAvailable >= reward.cost &&
    !!firebaseUid;
  const primaryButtonText = redeeming
    ? "Generando cupón..."
    : hasActiveRedemption
    ? "Ya tienes un cupón pendiente"
    : loadingLastRedemption
    ? "Consultando canjes previos..."
    : "Canjear y generar cupón";

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
                {cityLabel}
              </Text>
            </View>
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

          {hasActiveRedemption && lastRedemption ? (
            <View style={styles.pendingAlert}>
              <Text style={styles.pendingAlertTitle}>Cupón pendiente</Text>
              <View style={styles.pendingBody}>
                <Text style={styles.pendingEmoji}>🎟️</Text>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={styles.pendingHighlight}>
                    ¡Tienes un cupón activo para este comercio!
                  </Text>
                  <Text style={styles.pendingAlertText}>
                    Toca <Text style={styles.pendingBold}>“Ver QR”</Text> y
                    muéstralo al personal para validar tu canje.
                  </Text>
                  <Text style={styles.pendingAlertText}>
                    Al marcarlo como <Text style={styles.pendingBold}>canjeado</Text>,
                    podrás generar otro. Vence en{" "}
                    <Text style={styles.pendingBold}>30 días</Text> desde su creación.
                  </Text>
                </View>
              </View>
              <Text style={styles.pendingStatus}>
                Estado: {redemptionStatusLabel}
              </Text>
              <Text style={styles.pendingDates}>
                Creado: {formatDateShort(redemptionCreatedAt)} · Expira:{" "}
                {formatDateShort(redemptionExpiresAt)}
              </Text>
            </View>
          ) : null}

          <View style={{ gap: 10 }}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!canRedeem || redeeming) && styles.buttonDisabled,
              ]}
              onPress={handleRedeem}
              disabled={!canRedeem || redeeming}
            >
              <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
            </TouchableOpacity>

            {hasActiveRedemption && lastRedemption ? (
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
