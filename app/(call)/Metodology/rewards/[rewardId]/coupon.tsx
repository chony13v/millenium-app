import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";

import { Colors } from "@/constants/colors";
import { buildRedemptionQrUrl } from "@/services/rewards/redemptions";

export default function RedemptionCouponScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    redemptionId?: string;
    qrUrl?: string;
    rewardTitle?: string;
    merchantName?: string;
  }>();
  const getParamValue = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;

  const redemptionId = getParamValue(params.redemptionId) ?? "";
  const qrUrl =
    getParamValue(params.qrUrl) ||
    (redemptionId ? buildRedemptionQrUrl(redemptionId) : "");
  const rewardTitle = getParamValue(params.rewardTitle) ?? "Recompensa";
  const merchantName = getParamValue(params.merchantName) ?? "Comercio aliado";

  const handleCopyCode = async () => {
    if (!redemptionId) return;
    try {
      await Clipboard.setStringAsync(redemptionId);
      Alert.alert("Código copiado", "Pégalo si el comercio no puede escanear.");
    } catch (error) {
      Alert.alert("No pudimos copiar el código");
    }
  };

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
        <Text style={styles.headerTitle}>Cupón / QR</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.rewardTitle}>{rewardTitle}</Text>
        <Text style={styles.merchantText}>{merchantName}</Text>

        {qrUrl ? (
          <View style={styles.qrBox}>
            <QRCode value={qrUrl} size={220} backgroundColor="white" />
          </View>
        ) : (
          <Text style={styles.errorText}>
            No pudimos generar el código QR.
          </Text>
        )}

        <TouchableOpacity
          style={styles.codePill}
          onPress={handleCopyCode}
          accessibilityLabel="Copiar código manual"
        >
          <Text style={styles.codeLabel}>Código manual</Text>
          <Text style={styles.codeValue}>{redemptionId || "No disponible"}</Text>
        </TouchableOpacity>

        <Text style={styles.helperText}>
          Muestra este QR al comercio para validar tu canje. Guarda el código
          manual si necesitan ingresarlo a mano.
        </Text>

        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopyCode}
          disabled={!redemptionId}
        >
          <Text style={styles.copyButtonText}>Copiar código</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
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
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    alignItems: "center",
    gap: 12,
  },
  rewardTitle: {
    fontFamily: "barlow-semibold",
    fontSize: 20,
    color: "#0f172a",
    textAlign: "center",
  },
  merchantText: {
    fontFamily: "barlow-medium",
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
  },
  qrBox: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  codePill: {
    marginTop: 6,
    alignSelf: "stretch",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeLabel: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: "barlow-medium",
    fontSize: 13,
  },
  codeValue: {
    color: "white",
    fontFamily: "barlow-semibold",
    fontSize: 16,
    letterSpacing: 0.6,
  },
  helperText: {
    textAlign: "center",
    fontFamily: "barlow-regular",
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
  },
  copyButton: {
    marginTop: "auto",
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  copyButtonText: {
    color: "white",
    fontFamily: "barlow-semibold",
    fontSize: 15,
  },
  errorText: {
    color: "#b91c1c",
    fontFamily: "barlow-medium",
    textAlign: "center",
  },
});
