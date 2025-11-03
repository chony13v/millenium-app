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
      {/* Header con alineación al safe area (igual que el Drawer) */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.NAVY_BLUE} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Configuración</Text>
        </View>
        {/* Spacer para balancear el header */}
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
        bounces
        overScrollMode="always"
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="user-circle" size={24} color={Colors.NAVY_BLUE} />
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
            <Ionicons name="chevron-forward" size={20} color={Colors.NAVY_BLUE} />
          </TouchableOpacity>
        </View>

        <View style={styles.helpSection}>
          <MaterialIcons name="headset-mic" size={48} color={Colors.NAVY_BLUE} />
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
              <FontAwesome name="question-circle" size={20} color={Colors.NAVY_BLUE} />
              <Text style={[styles.getHelpButtonText, { color: Colors.NAVY_BLUE }]}>
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
    backgroundColor: "#F8F8F8",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // paddingTop lo damos dinámico con insets.top + 12
    paddingHorizontal: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "barlow-regular",
    color: Colors.NAVY_BLUE,
  },
  backButton: {
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "barlow-medium",
    color: Colors.NAVY_BLUE,
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.NAVY_BLUE,
  },
  settingItemButton: {
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  settingItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingItemText: {
    fontSize: 16,
    color: "#333333",
    fontFamily: "barlow-regular",
    marginLeft: 12,
  },
  helpSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  helpTitle: {
    fontSize: 24,
    fontFamily: "barlow-semibold",
    color: Colors.NAVY_BLUE,
    marginTop: 16,
  },
  helpDescription: {
    fontSize: 16,
    color: "#333333",
    fontFamily: "barlow-light",
    textAlign: "center",
    marginTop: 8,
  },
  helpButtonsContainer: {
    flexDirection: "row",
    marginTop: 16,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.NAVY_BLUE,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.NAVY_BLUE,
  },
  getHelpButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "barlow-medium",
    marginLeft: 8,
  },
  aboutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  aboutContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  aboutButtonText: {
    fontSize: 18,
    fontFamily: "barlow-semibold",
    color: Colors.NAVY_BLUE,
  },
  aboutVersion: {
    fontSize: 14,
    fontFamily: "barlow-regular",
    color: "#888888",
  },
});
