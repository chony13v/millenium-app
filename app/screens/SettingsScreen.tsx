import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "@clerk/clerk-expo";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import HelpSupportModal from "@/components/modals/HelpSupportModal";
import GetHelpModal from "@/components/modals/GetHelpModal";
import AboutModal from "@/components/modals/AboutModal";
import { Colors } from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);
  const [isHelpSupportVisible, setIsHelpSupportVisible] = useState(false);
  const [isGetHelpVisible, setIsGetHelpVisible] = useState(false);
  const [isAboutVisible, setIsAboutVisible] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleChangePasswordClick = () => {
    const hasGoogleAuth = user?.externalAccounts?.some(
      (account) => account.provider === "google"
    );

    if (hasGoogleAuth) {
      setIsHelpSupportVisible(true);
      return;
    }

    setIsChangePasswordVisible(true);
  };

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      await user?.updatePassword({
        currentPassword,
        newPassword,
      });
      Alert.alert("Éxito", "Contraseña actualizada correctamente");
      setIsChangePasswordVisible(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar la contraseña");
    }
  };

  const handleHelpSupport = () => {
    setIsHelpSupportVisible(true);
  };

  const handleGetHelp = () => {
    setIsGetHelpVisible(true);
  };

  const handleAbout = () => {
    setIsAboutVisible(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A2240", "#0ea5e9"]}
        start={[0, 0]}
        end={[1, 1]}
        style={[styles.heroCard, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Configuración</Text>
        <Text style={styles.heroSubtitle}>
          Ajusta tu cuenta, contraseñas y obtén ayuda rápida.
        </Text>
        <View style={styles.heroTags}>
          <Text style={styles.tag}>Cuenta</Text>
          <Text style={styles.tag}>Soporte</Text>
          <Text style={styles.tag}>Millenium</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollViewContent,
          { paddingBottom: 24 + insets.bottom },
        ]}
        bounces
        overScrollMode="always"
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome
              name="user-circle"
              size={24}
              color={Colors.NAVY_BLUE}
            />
            <Text style={styles.sectionTitle}>Cuenta</Text>
          </View>

          <TouchableOpacity
            style={[styles.settingItem, styles.settingItemButton]}
            onPress={handleChangePasswordClick}
          >
            <View style={styles.settingItemContent}>
              <FontAwesome name="lock" size={20} color={Colors.NAVY_BLUE} />
              <Text style={styles.settingItemText}>Cambiar Contraseña</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.NAVY_BLUE}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.helpSection}>
          <MaterialIcons
            name="headset-mic"
            size={44}
            color={Colors.NAVY_BLUE}
          />
          <Text style={styles.helpTitle}>¿Necesitas ayuda?</Text>
          <Text style={styles.helpDescription}>
            Nuestro equipo está disponible 24/7 para ayudarte con cualquier
            consulta sobre los Torneos Selectivos
          </Text>
          <View style={styles.helpButtonsContainer}>
            <TouchableOpacity style={styles.helpButton} onPress={handleGetHelp}>
              <FontAwesome name="phone" size={20} color="#FFFFFF" />
              <Text style={styles.getHelpButtonText}>Contactar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.helpButton, styles.secondaryButton]}
              onPress={handleHelpSupport}
            >
              <FontAwesome
                name="question-circle"
                size={20}
                color={Colors.NAVY_BLUE}
              />
              <Text
                style={[styles.getHelpButtonText, { color: Colors.NAVY_BLUE }]}
              >
                FAQ
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.aboutButton} onPress={handleAbout}>
          <View style={styles.aboutContent}>
            <View>
              <Text style={styles.aboutButtonText}>Acerca de Millenium</Text>
              <Text style={styles.aboutVersion}>Versión 1.1</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.NAVY_BLUE} />
        </TouchableOpacity>
      </ScrollView>

      {/* Modals */}
      <ChangePasswordModal
        visible={isChangePasswordVisible}
        onClose={() => setIsChangePasswordVisible(false)}
        onSave={handleChangePassword}
      />
      <HelpSupportModal
        visible={isHelpSupportVisible}
        onClose={() => setIsHelpSupportVisible(false)}
      />
      <GetHelpModal
        visible={isGetHelpVisible}
        onClose={() => setIsGetHelpVisible(false)}
      />
      <AboutModal
        visible={isAboutVisible}
        onClose={() => setIsAboutVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 30,
    gap: 16,
  },
  heroCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#0A2240",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    gap: 10,
  },
  heroTitle: {
    color: "white",
    fontFamily: "barlow-semibold",
    fontSize: 22,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: "barlow-regular",
    fontSize: 14,
    lineHeight: 20,
  },
  heroTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    color: "white",
    fontFamily: "barlow-medium",
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "barlow-semibold",
    color: Colors.NAVY_BLUE,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  settingItemButton: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    marginVertical: 2,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  settingItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingItemText: {
    fontSize: 15,
    color: "#0A2240",
    fontFamily: "barlow-medium",
  },
  helpSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 18,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  helpTitle: {
    fontSize: 20,
    fontFamily: "barlow-semibold",
    color: Colors.NAVY_BLUE,
    marginTop: 14,
  },
  helpDescription: {
    fontSize: 14,
    color: "#475569",
    fontFamily: "barlow-regular",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  helpButtonsContainer: {
    flexDirection: "row",
    marginTop: 16,
    gap: 10,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.NAVY_BLUE,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.NAVY_BLUE,
  },
  getHelpButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "barlow-semibold",
  },
  aboutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  aboutContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  aboutButtonText: {
    fontSize: 17,
    fontFamily: "barlow-semibold",
    color: Colors.NAVY_BLUE,
  },
  aboutVersion: {
    fontSize: 13,
    fontFamily: "barlow-regular",
    color: "#64748b",
  },
});
