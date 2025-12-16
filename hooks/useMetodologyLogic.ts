import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, Platform, Share, type ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useUser } from "@clerk/clerk-expo";

import {
  POINT_ACTIONS,
  getLevelProgress,
  type PointAction,
} from "@/constants/points";
import { type SocialPlatform } from "@/constants/social";
import { useFirebaseUid } from "@/hooks/useFirebaseUid";
import { useOfficialSocialLinks } from "@/hooks/useOfficialSocialLinks";
import { usePointsProfile } from "@/hooks/usePointsProfile";
import {
  awardActionEvent,
  awardSocialLinkEngagement,
  ensureReferralCodeForUser,
  loadReferralCode,
  recordSocialClick,
  redeemCode,
} from "@/services/metodologyService";
import {
  buildReferralLink,
  formatDate,
  platformLabel,
  renderHistoryLabel,
} from "@/utils/metodologyUtils";

const PLAY_STORE_URL =
  process.env.EXPO_PUBLIC_PLAY_STORE_URL || process.env.PLAY_STORE_URL || "";
const APP_STORE_URL =
  process.env.EXPO_PUBLIC_APP_STORE_URL || process.env.APP_STORE_URL || "";
const APP_DL_BASE_URL =
  process.env.EXPO_PUBLIC_APP_DL_BASE_URL || process.env.APP_DL_BASE_URL || "";
const REFERRER_REWARD_POINTS =
  Number(process.env.EXPO_PUBLIC_REFERRER_REWARD_POINTS) || 200;
const REDEEMER_REWARD_POINTS =
  Number(process.env.EXPO_PUBLIC_REDEEMER_REWARD_POINTS) || 100;

export const useMetodologyLogic = () => {
  const router = useRouter();
  const { user } = useUser();
  const { firebaseUid } = useFirebaseUid();
  const memberSince = user?.createdAt ? new Date(user.createdAt) : null;
  const scrollRef = useRef<ScrollView | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [redeemInput, setRedeemInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [referralSectionY, setReferralSectionY] = useState<number | null>(null);
  const [pointsSectionY, setPointsSectionY] = useState<number | null>(null);
  const [profileSectionY, setProfileSectionY] = useState<number | null>(null);
  const [ensureTried, setEnsureTried] = useState(false);
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [processingPlatform, setProcessingPlatform] =
    useState<SocialPlatform | null>(null);
  const [hasAwardToday, setHasAwardToday] = useState<
    Record<SocialPlatform, "available" | "blocked">
  >({
    facebook: "available",
    instagram: "available",
    tiktok: "available",
    youtube: "available",
  });

  const {
    profile,
    history,
    loading,
    availability,
    socialAvailability,
    loadingSocialAvailability,
    refreshFromServer,
    refreshSocialAvailability,
  } = usePointsProfile(
    firebaseUid,
    user?.primaryEmailAddress?.emailAddress ?? null
  );

  const {
    links: officialSocialLinks,
    loading: loadingSocialLinks,
    error: socialLinksError,
    refresh: refreshSocialLinks,
  } = useOfficialSocialLinks();

  useEffect(() => {
    setHasAwardToday(socialAvailability);
  }, [socialAvailability]);

  useEffect(() => {
    const loadCode = async () => {
      try {
        const code = await loadReferralCode(firebaseUid);
        if (code) {
          setReferralCode(code);
          console.log("[referral] referral_code_cached", {
            source: "firestore",
            referralCode: code,
          });
        }
      } catch (err) {
        console.warn("[referral] no referral code cached", err);
      }
    };

    loadCode();
  }, [firebaseUid]);

  useEffect(() => {
    if (socialLinksError) {
      console.warn("[social] No se pudieron cargar las redes oficiales", {
        socialLinksError,
      });
    }
  }, [socialLinksError]);

  useEffect(() => {
    if (!socialModalVisible) return;
    refreshSocialLinks();
    refreshSocialAvailability();
  }, [socialModalVisible, refreshSocialLinks, refreshSocialAvailability]);

  const greeting = user?.firstName || user?.fullName || "Jugador de Ciudad FC";

  const progress = useMemo(
    () => getLevelProgress(profile.total),
    [profile.total]
  );
  const levelDisplay = profile.level ?? progress.level;
  const xpToNext = profile.xpToNext ?? progress.xpToNext;
  const progressValue = progress.progress ?? 0;

  const referralLinkConfig = {
    playStoreUrl: PLAY_STORE_URL,
    appStoreUrl: APP_STORE_URL,
    appDlBaseUrl: APP_DL_BASE_URL,
  } as const;

  const handleGenerateCode = async () => {
    if (loadingCode) return;
    if (referralCode) {
      console.log("[referral] referral_code_cached", {
        source: "state",
        referralCode,
      });
      return;
    }
    if (ensureTried) {
      Alert.alert(
        "No disponible",
        "No se pudo obtener tu código. Intenta nuevamente más tarde."
      );
      return;
    }
    setLoadingCode(true);
    try {
      console.log("[referral] referral_code_requested");
      const ensured = await ensureReferralCodeForUser(firebaseUid);
      setEnsureTried(true);
      if (ensured) {
        setReferralCode(ensured);
        return;
      }
      Alert.alert(
        "No disponible",
        "No pudimos generar tu código ahora. Intenta nuevamente."
      );
    } catch (error: any) {
      Alert.alert(
        "No disponible",
        "El servicio de referidos no está disponible ahora. Inténtalo más tarde."
      );
    } finally {
      setLoadingCode(false);
    }
  };

  const handleShareCode = async () => {
    if (sharing || loadingCode) return;
    setSharing(true);
    let code = referralCode;
    try {
      console.log("[referral] referral_share_tapped", {
        platform: Platform.OS,
        referralCode: code,
      });
      if (!code) {
        const ensured = await ensureReferralCodeForUser(firebaseUid);
        setEnsureTried(true);
        code = ensured ?? code;
        setReferralCode(code);
      }
      if (!code) {
        Alert.alert(
          "Generando tu código...",
          "Intenta nuevamente en unos segundos."
        );
        return;
      }

      const { url: link, linkType } = buildReferralLink(
        code,
        referralLinkConfig
      );
      const points = REDEEMER_REWARD_POINTS || 100;
      const title = "Únete a Ciudad FC";
      const message = `Descarga la app y canjea mi código ${code} para ganar ${points} puntos de bienvenida 🎉\n${link}`;

      const result = await Share.share({
        title,
        message,
      });

      if (result.action === Share.sharedAction) {
        console.log("[referral] referral_share_success", {
          platform: Platform.OS,
          referralCode: code,
          utmIncluded: true,
          linkType,
        });
      }
    } catch (error) {
      console.warn("[referral] share failed, copying fallback", error);
      try {
        const codeToUse = referralCode ?? "MI_CODIGO";
        const { url: link } = buildReferralLink(codeToUse, referralLinkConfig);
        const points = REDEEMER_REWARD_POINTS || 100;
        const message = `Descarga la app y canjea mi código ${codeToUse} para ganar ${points} puntos de bienvenida 🎉\n${link}`;
        await Clipboard.setStringAsync(message);
        Alert.alert(
          "Texto copiado",
          "Pega el mensaje donde quieras compartirlo."
        );
        console.log("[referral] referral_share_copied", {
          platform: Platform.OS,
          referralCode: codeToUse,
          utmIncluded: true,
          linkType: "dynamic",
        });
      } catch (copyError) {
        Alert.alert("No se pudo compartir. Inténtalo nuevamente.");
      }
    } finally {
      setSharing(false);
    }
  };

  const handleRedeem = async () => {
    if (!redeemInput.trim()) {
      Alert.alert("Código requerido", "Ingresa un código para canjearlo.");
      return;
    }
    setRedeeming(true);
    const codeTrimmed = redeemInput.trim();
    console.log("[referral] referral_code_requested", {
      code: codeTrimmed,
    });
    try {
      const result = await redeemCode(codeTrimmed);
      if (result.alreadyRedeemed) {
        Alert.alert(
          result.message ?? "✅ Código ya canjeado anteriormente",
          `Código registrado: ${result.codeUsed ?? codeTrimmed}`
        );
      } else if (result.success) {
        Alert.alert(
          result.message ?? "✅ Canje realizado",
          `Sumaste ${result.redeemerPoints ?? 100} pts. El referente ganó ${
            result.referrerPoints ?? 200
          } pts.`
        );
      } else {
        Alert.alert("No disponible", result.message ?? "No se pudo canjear.");
      }
      if (result.success) {
        await refreshFromServer();
      }
    } catch (error: any) {
      const errorCode =
        typeof error?.code === "string"
          ? (error.code as string).replace("functions/", "")
          : null;
      const rawMessage =
        (typeof error?.message === "string" && error.message) ||
        "No se pudo canjear el código ahora. Intenta de nuevo.";
      const cleanMessage =
        rawMessage.replace(/^functions\/[a-z-]+:\s*/i, "").trim() ||
        errorCode ||
        "No se pudo canjear el código ahora. Intenta de nuevo.";
      Alert.alert("No disponible", cleanMessage);
    } finally {
      setRedeeming(false);
    }
  };

  const handleSocialLinkPress = async (
    link: (typeof officialSocialLinks)[number]
  ) => {
    const label = platformLabel(link.platform);
    if (!firebaseUid) {
      Alert.alert(
        "No disponible",
        "Inicia sesión para ganar puntos por redes sociales."
      );
      return;
    }
    if (hasAwardToday[link.platform] === "blocked") {
      Alert.alert(
        "No disponible",
        `Recompensa de hoy ya acreditada para ${label}.`
      );
      return;
    }

    setProcessingPlatform(link.platform);

    let awarded = false;

    try {
      console.log("[social] calling awardSocialEngagement", {
        linkId: link.linkId,
        platform: link.platform,
        url: link.link,
        source: "Category.tsx",
      });
      await recordSocialClick(firebaseUid, link);

      const result = await awardSocialLinkEngagement(link);

      awarded = result?.success === true;
      if (!awarded) {
        throw new Error("awardSocialEngagement failed");
      }

      if (result.alreadyAwarded) {
        Alert.alert(
          "Ya acreditado",
          `Ya obtuviste la recompensa de hoy para ${label}.`
        );
      }

      try {
        const supported = await Linking.canOpenURL(link.link);
        if (supported) {
          await Linking.openURL(link.link);
        } else {
          Alert.alert(
            "No se pudo abrir",
            "No pudimos abrir el enlace seleccionado en este dispositivo."
          );
        }
      } catch (error) {
        console.warn("[social] open url failed", error);
        Alert.alert(
          "No se pudo abrir",
          "Verifica tu conexión o intenta nuevamente."
        );
      }

      setHasAwardToday((prev) => ({
        ...prev,
        [link.platform]: "blocked",
      }));

      try {
        await Promise.all([refreshFromServer(), refreshSocialAvailability()]);
      } catch (refreshError) {
        console.warn("[social] refresh after award failed", refreshError);
      }
    } catch (error: any) {
      console.error("[social] award failed", error);
      if (!awarded) {
        setHasAwardToday((prev) => ({
          ...prev,
          [link.platform]: socialAvailability[link.platform] ?? "available",
        }));
      }
      Alert.alert(
        "No pudimos registrar tu visita",
        "No pudimos registrar tu visita. Intenta nuevamente."
      );
    } finally {
      setProcessingPlatform(null);
    }
  };

  const handleActionPress = async (action: PointAction) => {
    if (
      action.eventType === "city_report_created" ||
      action.eventType === "poll_vote" ||
      action.eventType === "weekly_event_attendance"
    ) {
      router.push("/(call)/Conecta");
      return;
    }

    if (action.eventType === "referral_signup") {
      scrollRef.current?.scrollTo({ y: referralSectionY, animated: true });
      return;
    }

    if (action.eventType === "social_follow") {
      if (!firebaseUid) {
        Alert.alert(
          "No disponible",
          "Necesitas iniciar sesión para ganar puntos por redes sociales."
        );
        return;
      }
      try {
        await Promise.all([refreshSocialLinks(), refreshSocialAvailability()]);
      } catch {
        // best effort; modal seguirá mostrando el estado actual
      }
      setSocialModalVisible(true);
      return;
    }

    if (action.eventType === "streak_bonus") {
      // Lleva al inicio de la pestaña para ver progreso/racha sin mostrar alertas
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    try {
      await awardActionEvent(action, firebaseUid);
      Alert.alert(
        "Enviado",
        "Registramos tu intento. Se validará elegibilidad y sumará puntos si corresponde."
      );
    } catch (error) {
      Alert.alert(
        "No disponible",
        "Aún no conectamos esta acción a puntos."
      );
    }
  };

  return {
    greeting,
    progressValue,
    levelDisplay,
    xpToNext,
    profile,
    history,
    loading,
    availability,
    socialAvailability,
    loadingSocialAvailability,
    referralCode,
    loadingCode,
    sharing,
    redeemInput,
    setRedeemInput,
    redeeming,
    handleGenerateCode,
    handleShareCode,
    handleRedeem,
    handleActionPress,
    scrollRef,
    setReferralSectionY,
    pointsSectionY,
    setPointsSectionY,
    profileSectionY,
    setProfileSectionY,
    renderHistoryLabel,
    formatDate,
    POINT_ACTIONS,
    socialModalVisible,
    setSocialModalVisible,
    officialSocialLinks,
    loadingSocialLinks,
    hasAwardToday,
    processingPlatform,
    handleSocialLinkPress,
    memberSince,
  } as const;
};

export type UseMetodologyLogicReturn = ReturnType<typeof useMetodologyLogic>;
