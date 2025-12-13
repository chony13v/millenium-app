import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import {
  PendingRedemptionAlert,
  PointsBalanceCard,
  RedemptionInfoCard,
  RewardActions,
  RewardDetailHeader,
  RewardHero,
  styles,
} from "./[rewardId]/RewardDetailComponents";

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

const getCityLabel = (
  rewardCityId?: string | null,
  userCityId?: string | null
) => {
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
        if (redemption) {
          const createdAtDate =
            redemption.createdAt && "toDate" in redemption.createdAt
              ? redemption.createdAt.toDate()
              : null;
          const shouldKeep =
            reward?.isLimited === true || redemption.status !== "redeemed";
          setLastRedemption(
            shouldKeep
              ? {
                  id: redemption.id,
                  status: redemption.status,
                  qrUrl: redemption.qrUrl,
                  createdAt: redemption.createdAt ?? null,
                  createdAtDate,
                }
              : null
          );
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
  }, [firebaseUid, rewardId, reward?.isLimited]);

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
    if (reward.isLimited && lastRedemption) {
      Alert.alert(
        "Ya canjeaste esta recompensa",
        "Solo puedes canjear una vez por usuario."
      );
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
      if (reward.isLimited) {
        const nextRemaining =
          redemption.remaining ??
          (typeof reward.remaining === "number"
            ? Math.max(reward.remaining - 1, 0)
            : reward.remaining ?? null);
        setReward((prev) =>
          prev ? { ...prev, remaining: nextRemaining } : prev
        );
      }
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
  const remaining = reward?.remaining;
  const isLimited = reward?.isLimited;
  const soldOut = isLimited && (remaining ?? 0) <= 0;
  const cityLabel = getCityLabel(reward?.cityId ?? null, selectedCity);
  const canRedeem =
    !!reward &&
    !redeeming &&
    !loadingPoints &&
    !loadingLastRedemption &&
    !hasActiveRedemption &&
    !soldOut &&
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
      <RewardDetailHeader onBack={() => router.back()} />

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
          <RewardHero reward={reward} />

          <RedemptionInfoCard
            reward={reward}
            cityLabel={cityLabel}
            remaining={remaining}
            isLimited={isLimited}
            soldOut={soldOut}
          />

          <PointsBalanceCard
            pointsAvailable={pointsAvailable}
            rewardCost={reward.cost}
          />

          {hasActiveRedemption && lastRedemption ? (
            <PendingRedemptionAlert
              statusLabel={redemptionStatusLabel}
              createdAtLabel={formatDateShort(redemptionCreatedAt)}
              expiresAtLabel={formatDateShort(redemptionExpiresAt)}
            />
          ) : null}

          <RewardActions
            onRedeem={handleRedeem}
            onViewQr={
              hasActiveRedemption && lastRedemption
                ? () => openQrScreen(lastRedemption.id, lastRedemption.qrUrl)
                : undefined
            }
            primaryButtonText={primaryButtonText}
            disabled={!canRedeem || redeeming}
            showViewQr={hasActiveRedemption && !!lastRedemption}
          />
        </ScrollView>
      ) : null}
    </View>
  );
}
