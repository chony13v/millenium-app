import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Platform,
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import * as Clipboard from "expo-clipboard";
import { Colors } from "@/constants/colors";
import { useFirebaseUid } from "@/hooks/useFirebaseUid";
import {
  POINT_ACTIONS,
  getLevelProgress,
  type PointAction,
} from "@/constants/points";
import { usePointsProfile } from "@/hooks/usePointsProfile";
import { awardPointsEvent } from "@/services/points/awardPoints";
import {
  ensureReferralCode,
  fetchReferralCode,
  redeemReferralCode,
} from "@/services/referrals";

const PLAY_STORE_URL =
  process.env.EXPO_PUBLIC_PLAY_STORE_URL ||
  process.env.PLAY_STORE_URL ||
  "";
const APP_STORE_URL =
  process.env.EXPO_PUBLIC_APP_STORE_URL ||
  process.env.APP_STORE_URL ||
  "";
const APP_DL_BASE_URL =
  process.env.EXPO_PUBLIC_APP_DL_BASE_URL ||
  process.env.APP_DL_BASE_URL ||
  "";
const REFERRER_REWARD_POINTS =
  Number(process.env.EXPO_PUBLIC_REFERRER_REWARD_POINTS) || 200;
const REDEEMER_REWARD_POINTS =
  Number(process.env.EXPO_PUBLIC_REDEEMER_REWARD_POINTS) || 100;

export default function Metodology() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const { firebaseUid } = useFirebaseUid();
  const scrollRef = useRef<ScrollView | null>(null);
  const { profile, history, loading, availability, refreshFromServer } =
    usePointsProfile(
      firebaseUid,
      user?.primaryEmailAddress?.emailAddress ?? null
    );
  const [referralCode, setReferralCode] = React.useState<string | null>(null);
  const [loadingCode, setLoadingCode] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);
  const [redeemInput, setRedeemInput] = React.useState("");
  const [redeeming, setRedeeming] = React.useState(false);
  const [referralSectionY, setReferralSectionY] = React.useState(0);
  const [ensureTried, setEnsureTried] = React.useState(false);

  const greeting = user?.firstName || user?.fullName || "Jugador de Ciudad FC";

  const progress = useMemo(
    () => getLevelProgress(profile.total),
    [profile.total]
  );
  const levelDisplay = profile.level ?? progress.level;
  const xpToNext = profile.xpToNext ?? progress.xpToNext;
  const progressValue = progress.progress ?? 0;

  React.useEffect(() => {
    const loadCode = async () => {
      try {
        const code = await fetchReferralCode(firebaseUid);
        if (code) {
          setReferralCode(code);
          console.log("[referral] referral_code_cached", {
            source: "firestore",
            referralCode: code,
          });
          return;
        }
      } catch (err) {
        console.warn("[referral] no referral code cached", err);
      }
    };

    loadCode();
  }, [firebaseUid]);

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
      const ensured = await ensureReferralCode();
      setEnsureTried(true);
      if (ensured) {
        setReferralCode(ensured);
        return;
      }
      const fetched = await fetchReferralCode(firebaseUid);
      if (fetched) {
        setReferralCode(fetched);
        console.log("[referral] referral_code_cached", {
          source: "firestore_after_ensure",
          referralCode: fetched,
        });
      } else {
        Alert.alert(
          "No disponible",
          "No pudimos generar tu código ahora. Intenta nuevamente."
        );
      }
    } catch (error: any) {
      Alert.alert(
        "No disponible",
        "El servicio de referidos no está disponible ahora. Inténtalo más tarde."
      );
    } finally {
      setLoadingCode(false);
    }
  };

  const buildReferralLink = (code: string) => {
    const base =
      Platform.OS === "android"
        ? PLAY_STORE_URL || APP_DL_BASE_URL
        : APP_STORE_URL || APP_DL_BASE_URL || PLAY_STORE_URL;
    const safeBase = base || APP_DL_BASE_URL || "https://ciudadfc.app";
    const linkType =
      safeBase === PLAY_STORE_URL || safeBase === APP_STORE_URL ? "store" : "dynamic";
    const separator = safeBase.includes("?") ? "&" : "?";
    const url = `${safeBase}${separator}utm_source=share&utm_medium=referral&utm_campaign=referral_code&utm_content=${encodeURIComponent(
      code
    )}`;
    return { url, linkType };
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
        const ensured = await ensureReferralCode();
        setEnsureTried(true);
        code = ensured ?? code;
        if (!code) {
          const fetched = await fetchReferralCode(firebaseUid);
          code = fetched ?? null;
        }
        if (code) {
          console.log("[referral] referral_code_cached", {
            source: "share_flow_fetch",
            referralCode: code,
          });
        }
        setReferralCode(code);
      }
      if (!code) {
        Alert.alert("Generando tu código...", "Intenta nuevamente en unos segundos.");
        return;
      }

      const { url: link, linkType } = buildReferralLink(code);
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
        const code = referralCode ?? "MI_CODIGO";
        const { url: link } = buildReferralLink(code);
        const points = REDEEMER_REWARD_POINTS || 100;
        const message = `Descarga la app y canjea mi código ${code} para ganar ${points} puntos de bienvenida 🎉\n${link}`;
        await Clipboard.setStringAsync(message);
        Alert.alert("Texto copiado", "Pega el mensaje donde quieras compartirlo.");
        console.log("[referral] referral_share_copied", {
          platform: Platform.OS,
          referralCode: code,
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

  const renderHistoryLabel = (eventType: string) => {
    const base = eventType.split(":")[0];
    switch (base) {
      case "app_open_daily":
        return "Entrada diaria";
      case "poll_vote":
        return "Respuesta de encuesta";
      case "city_report_created":
        return "Reporte ciudadano";
      case "weekly_event_attendance":
        return "Asistencia a evento gratuito";
      case "social_follow":
        return "Sigue redes Ciudad FC";
      case "referral_signup":
        return "Invitación aprobada";
      case "referral_reward":
        return "Recompensa por referido";
      case "referral_redeem":
        return "Canje de referido";
      case "streak_bonus":
        return "Bono por racha";
      default:
        return eventType;
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Sin fecha";
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
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
      const result = await redeemReferralCode(codeTrimmed);
      if (result.alreadyRedeemed) {
        Alert.alert(
          result.message ?? "✅ Código ya canjeado anteriormente",
          `Código registrado: ${result.codeUsed ?? codeTrimmed}`
        );
      } else if (result.success) {
        Alert.alert(
          result.message ?? "✅ Canje realizado",
          `Sumaste ${result.redeemerPoints ?? 100} pts. El referente ganó ${result.referrerPoints ?? 200} pts.`
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

    try {
      await awardPointsEvent({ eventType: action.eventType, userId: firebaseUid });
      Alert.alert(
        "Enviado",
        "Registramos tu intento. El backend validará elegibilidad y sumará puntos si corresponde."
      );
    } catch (error) {
      Alert.alert(
        "No disponible",
        "Aún no conectamos esta acción al backend de puntos."
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 20 },
      ]}
      showsVerticalScrollIndicator={false}
      ref={scrollRef}
    >
      <LinearGradient
        colors={["#1e3a8a", "#1e3a8a"]}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.heroCard}
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

      <View
        style={styles.sectionCard}
        onLayout={(e) => setReferralSectionY(e.nativeEvent.layout.y)}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Invita amigos</Text>
          <Text style={styles.sectionPill}>Referidos</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Comparte tu código y ambos reciben puntos cuando lo usen.
        </Text>
        <View style={styles.referralRow}>
          <View style={styles.referralCodeBox}>
            <Text style={styles.referralCodeLabel}>Tu código</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.referralCodeValue}>
                {referralCode ?? "Toca \"Obtener código\""}
              </Text>
              {referralCode ? (
                <View style={styles.referralActiveBadge}>
                  <Text style={styles.referralActiveText}>Activo</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.referralButtons}>
            <TouchableOpacity
              style={[
                styles.generateButton,
                (loadingCode || referralCode) && styles.actionCardDisabled,
              ]}
              onPress={handleGenerateCode}
              disabled={loadingCode || !!referralCode}
            >
              <Text style={styles.generateButtonText}>
                {referralCode
                  ? `Código activo`
                  : loadingCode
                  ? "Generando..."
                  : "Obtener código"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.shareButton,
                (sharing || loadingCode) && styles.actionCardDisabled,
              ]}
              onPress={handleShareCode}
              disabled={sharing || loadingCode}
              accessibilityLabel="Compartir código de referido"
              testID="share-referral-button"
            >
              <Text style={styles.shareButtonText}>
                {sharing ? "Compartiendo..." : "Compartir"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.redeemContainer}>
          <Text style={styles.referralCodeLabel}>Canjear código</Text>
          <View style={styles.redeemRow}>
            <TextInput
              style={styles.redeemInput}
              placeholder="ABC12345"
              autoCapitalize="characters"
              value={redeemInput}
              onChangeText={setRedeemInput}
            />
            <TouchableOpacity
              style={[
                styles.redeemButton,
                (redeeming || !redeemInput.trim()) && styles.actionCardDisabled,
              ]}
              disabled={redeeming || !redeemInput.trim()}
              onPress={handleRedeem}
            >
              <Text style={styles.redeemButtonText}>
                {redeeming ? "Enviando..." : "Canjear"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cómo ganar puntos</Text>
          <Text style={styles.sectionPill}>Catálogo</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Acciones disponibles y su elegibilidad. La validación final la hace el
          backend para evitar duplicados.
        </Text>

        {POINT_ACTIONS.map((action) => {
          const isBlocked = availability[action.eventType] === "blocked";
          return (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionCard,
                isBlocked && styles.actionCardDisabled,
              ]}
              disabled={loading || isBlocked}
              onPress={() => handleActionPress(action)}
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

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial reciente</Text>
          <Text style={[styles.sectionPill, styles.pillMuted]}>Últimos 20</Text>
        </View>

        {loading && <Text style={styles.mutedText}>Cargando puntos...</Text>}

        {!loading && history.length === 0 && (
          <Text style={styles.mutedText}>
            Aún no tienes movimientos en tu perfil de puntos.
          </Text>
        )}

        {history.map((entry) => (
          <View key={entry.id} style={styles.historyRow}>
            <View>
              <Text style={styles.historyTitle}>
                {renderHistoryLabel(entry.eventType)}
              </Text>
              <Text style={styles.historyDate}>
                {formatDate(entry.createdAt?.toDate())}
              </Text>
            </View>
            <Text
              style={[
                styles.historyPoints,
                entry.points >= 0
                  ? styles.pointsPositive
                  : styles.pointsNegative,
              ]}
            >
              {entry.points >= 0 ? "+" : ""}
              {entry.points} pts
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  heroCard: {
    borderRadius: 18,
    padding: 18,
    gap: 10,
    marginTop: 6,
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroTitle: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "barlow-regular",
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  heroTitlePill: {
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: "barlow-regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  sponsorBox: {
    marginTop: 10,
    marginBottom: 4,
    alignSelf: "stretch",
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: "center",
  },
  sponsorLogo: {
    width: 200,
    height: 90,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  statLabel: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "barlow-medium",
    fontSize: 12,
  },
  statValue: {
    color: "white",
    fontFamily: "barlow-semibold",
    fontSize: 20,
  },
  statHint: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: "barlow-regular",
    fontSize: 12,
  },
  progressBar: {
    width: "100%",
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#facc15",
  },
  progressLabel: {
    marginTop: 4,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "barlow-medium",
    fontSize: 12,
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "barlow-semibold",
    color: Colors.NAVY_BLUE,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: "barlow-regular",
    color: "#475569",
    lineHeight: 20,
  },
  sectionPill: {
    backgroundColor: "#e0f2fe",
    color: "#0ea5e9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontFamily: "barlow-medium",
    fontSize: 12,
  },
  pillMuted: {
    backgroundColor: "#e2e8f0",
    color: "#0f172a",
  },
  actionCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 8,
    backgroundColor: "#f8fafc",
  },
  actionCardDisabled: {
    opacity: 0.7,
  },
  referralRow: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#f8fafc",
    gap: 10,
  },
  referralCodeBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  referralCodeLabel: {
    color: "#6b7280",
    fontFamily: "barlow-medium",
  },
  referralCodeValue: {
    fontSize: 18,
    fontFamily: "barlow-semibold",
    color: Colors.PRIMARY,
    letterSpacing: 1,
  },
  referralActiveBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(34,197,94,0.14)",
    borderRadius: 10,
  },
  referralActiveText: {
    color: "#15803d",
    fontFamily: "barlow-semibold",
    fontSize: 12,
  },
  generateButton: {
    alignSelf: "flex-end",
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  generateButtonText: {
    color: "#fff",
    fontFamily: "barlow-semibold",
    fontSize: 13,
  },
  referralButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  shareButton: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  shareButtonText: {
    color: "#fff",
    fontFamily: "barlow-semibold",
    fontSize: 13,
  },
  redeemContainer: {
    marginTop: 16,
    gap: 6,
  },
  redeemRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  redeemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontFamily: "barlow-semibold",
    letterSpacing: 1,
  },
  redeemButton: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  redeemButtonText: {
    color: "#fff",
    fontFamily: "barlow-semibold",
  },
  actionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontFamily: "barlow-semibold",
    color: "#0f172a",
  },
  actionSubtitle: {
    fontSize: 13,
    fontFamily: "barlow-regular",
    color: "#475569",
  },
  actionPoints: {
    fontSize: 15,
    fontFamily: "barlow-semibold",
    color: "#0ea5e9",
  },
  actionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionFrequency: {
    fontSize: 12,
    fontFamily: "barlow-medium",
    color: "#0f172a",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontFamily: "barlow-semibold",
    fontSize: 12,
  },
  badgeAvailable: {
    backgroundColor: "rgba(34,197,94,0.15)",
    color: "#15803d",
  },
  badgeBlocked: {
    backgroundColor: "rgba(248,113,113,0.15)",
    color: "#b91c1c",
  },
  historyRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyTitle: {
    fontSize: 14,
    fontFamily: "barlow-medium",
    color: "#0f172a",
  },
  historyDate: {
    fontSize: 12,
    fontFamily: "barlow-regular",
    color: "#64748b",
  },
  historyPoints: {
    fontSize: 14,
    fontFamily: "barlow-semibold",
  },
  pointsPositive: {
    color: "#16a34a",
  },
  pointsNegative: {
    color: "#ef4444",
  },
  mutedText: {
    color: "#64748b",
    fontFamily: "barlow-regular",
    fontSize: 13,
  },
});
