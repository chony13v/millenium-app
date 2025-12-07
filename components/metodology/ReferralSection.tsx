import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import { metodologyStyles as styles } from "@/styles/metodology.styles";

export type ReferralSectionProps = {
  referralCode: string | null;
  loadingCode: boolean;
  sharing: boolean;
  redeemInput: string;
  redeeming: boolean;
  onGenerate: () => void;
  onShare: () => void;
  onRedeem: () => void;
  onRedeemInputChange: (value: string) => void;
  onLayout?: (y: number) => void;
};

export const ReferralSection: React.FC<ReferralSectionProps> = ({
  referralCode,
  loadingCode,
  sharing,
  redeemInput,
  redeeming,
  onGenerate,
  onShare,
  onRedeem,
  onRedeemInputChange,
  onLayout,
}) => (
  <View
    style={styles.sectionCard}
    onLayout={(e) => onLayout?.(e.nativeEvent.layout.y)}
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
            {referralCode ?? 'Toca "Obtener código"'}
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
          onPress={onGenerate}
          disabled={loadingCode || !!referralCode}
          accessibilityLabel="Obtener código de referido"
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
          onPress={onShare}
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
          onChangeText={onRedeemInputChange}
          accessibilityLabel="Ingresa código de referido"
        />
        <TouchableOpacity
          style={[
            styles.redeemButton,
            (redeeming || !redeemInput.trim()) && styles.actionCardDisabled,
          ]}
          disabled={redeeming || !redeemInput.trim()}
          onPress={onRedeem}
          accessibilityLabel="Canjear código"
        >
          <Text style={styles.redeemButtonText}>
            {redeeming ? "Enviando..." : "Canjear"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);
