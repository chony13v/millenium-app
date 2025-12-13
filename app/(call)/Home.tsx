import React, { useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Linking,
} from "react-native";
import DrawerLayout from "react-native-gesture-handler/DrawerLayout";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import Academy from "@/components/home/Academy";
import { useRouter } from "expo-router";
import DrawerContent from "@/components/DrawerContent";
import SignOutDialog from "@/components/SignOutDialog";
import CategoryIcons from "@/components/home/Category";
import News from "@/components/home/News";
import useFonts from "@/hooks/useFonts";
import LoadingBall from "@/components/LoadingBall";
import { useCitySelection } from "@/hooks/useCitySelection";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CITY_OPTIONS } from "@/constants/cities";
import { useUser } from "@clerk/clerk-expo";
import { useFirebaseUid } from "@/hooks/useFirebaseUid";
import { logSponsorClick } from "@/services/analytics/sponsorClicks";

const buildInitials = (
  firstName?: string | null,
  lastName?: string | null,
  fullName?: string | null
) => {
  const first = firstName?.trim();
  const last = lastName?.trim();
  if (first || last) {
    const firstInitial = first?.[0]?.toUpperCase() ?? "";
    const lastInitial = last?.[0]?.toUpperCase() ?? "";
    return `${firstInitial}${lastInitial}`.trim() || firstInitial || lastInitial || "CF";
  }
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length) {
      const firstInitial = parts[0][0]?.toUpperCase() ?? "";
      const lastInitial = parts.length > 1 ? parts[parts.length - 1][0]?.toUpperCase() ?? "" : "";
      return `${firstInitial}${lastInitial}`.trim() || firstInitial || "CF";
    }
  }
  return "CF";
};

export default function HomeScreen() {
  const drawerRef = useRef<DrawerLayout>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedCity } = useCitySelection();
  const { user } = useUser();
  const { firebaseUid } = useFirebaseUid();
  const fontsLoaded = useFonts();
  const selectedCityInfo = CITY_OPTIONS.find(
    (city) => city.id === selectedCity
  );
  const [isSignOutVisible, setIsSignOutVisible] = useState(false);

  const handleCalendarPress = () => {
    router.push("/screens/CalendarScreen");
  };

  const handleProfilePress = () => {
    router.push("/screens/ProfileScreen");
  };

  const handleSettingsPress = () => {
    router.push("/screens/SettingsScreen");
  };

  const handleSignOutPress = () => {
    setIsSignOutVisible(true);
  };

  const handleGoToConecta = () => {
    router.push("/(call)/Conecta");
  };

  const handleOpenBgr = () => {
    logSponsorClick({
      sponsorId: "bgr",
      url: "https://www.bgr.com.ec/",
      userId: firebaseUid,
    });
    Linking.openURL("https://www.bgr.com.ec/").catch(() => {});
  };

  const handleOpenRiobamba = () => {
    logSponsorClick({
      sponsorId: "alcaldia_riobamba",
      url: "https://www.gadmriobamba.gob.ec/",
      userId: firebaseUid,
    });
    Linking.openURL("https://www.gadmriobamba.gob.ec/").catch(() => {});
  };

  const handleOpenMillenium = () => {
    logSponsorClick({
      sponsorId: "millenium_fc",
      url: "https://www.milleniumfc.com/",
      userId: firebaseUid,
    });
    Linking.openURL("https://www.milleniumfc.com/").catch(() => {});
  };

  const handleGoToClub = () => {
    router.navigate("/(call)/Metodology?scrollTo=profile");
  };

  if (!fontsLoaded) {
    return <LoadingBall text="Cargando..." />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DrawerLayout
        ref={drawerRef}
        drawerWidth={250}
        drawerPosition="left"
        drawerType="slide"
        renderNavigationView={() => (
          <DrawerContent
            onCalendarPress={handleCalendarPress}
            onProfilePress={handleProfilePress}
            onSettingsPress={handleSettingsPress}
            onSignOutPress={handleSignOutPress}
          />
        )}
      >
        <View style={styles.screen}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: 32 + insets.bottom },
            ]}
          >
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <TouchableOpacity
                  onPress={() => drawerRef.current?.openDrawer()}
                  style={styles.menuButton}
                  activeOpacity={0.9}
                >
                  <Ionicons name="menu" size={22} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.brandTitle}>CIUDAD FC</Text>
                <TouchableOpacity
                  onPress={handleGoToClub}
                  activeOpacity={0.85}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <View style={styles.initialsBadge}>
                    <Text style={styles.greetingText}>
                      {buildInitials(
                        user?.firstName,
                        user?.lastName,
                        user?.fullName
                      )}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={styles.heroSubtitle}>
                Participa y vive el deporte y la cultura en tu ciudad
              </Text>
            </View>
            <View style={styles.logoContainer}>
              <Text style={styles.sponsorLabel}>Con el auspicio de:</Text>
              <View style={styles.logoRow}>
                <TouchableOpacity
                  onPress={handleOpenRiobamba}
                  activeOpacity={0.8}
                  accessibilityRole="link"
                  accessibilityLabel="Abrir Alcaldía de Riobamba"
                >
                  <Image
                    source={require("@/assets/images/logo_alcaldiaRiobamba.png")}
                    style={styles.cityLogo}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleOpenMillenium}
                  activeOpacity={0.8}
                  accessibilityRole="link"
                  accessibilityLabel="Abrir Millenium FC"
                >
                  <Image
                    source={require("@/assets/images/LogoFC.png")}
                    style={styles.cityLogo}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleOpenBgr}
                  activeOpacity={0.8}
                  accessibilityRole="link"
                  accessibilityLabel="Abrir BGR"
                >
                  <Image
                    source={require("@/assets/images/logo-bgr-blue.png")}
                    style={styles.cityLogo}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Canales oficiales</Text>
                </View>
                <Text style={[styles.sectionPill, styles.pillCommunity]}>
                  Comunidad
                </Text>
              </View>
              <CategoryIcons />
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Historias Ciudad FC</Text>
                </View>
                <Text style={[styles.sectionPill, styles.pillAcademy]}>
                  Videos
                </Text>
              </View>
              <Academy />
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Noticias Ciudad FC</Text>
                </View>
                <Text style={[styles.sectionPill, styles.pillNews]}>
                  Novedades
                </Text>
              </View>
              <News />
            </View>
          </ScrollView>
        </View>
      </DrawerLayout>
      <SignOutDialog
        visible={isSignOutVisible}
        onClose={() => setIsSignOutVisible(false)}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
  heroCard: {
    marginTop: 6,
    padding: 0,
    borderRadius: 0,
    width: "100%",
    minHeight: 100,
    gap: 10,
    backgroundColor: "transparent",
    borderWidth: 0,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  heroBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 2,
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.16)",
    color: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontFamily: "barlow-semibold",
    letterSpacing: 0.4,
    fontSize: 12,
  },
  heroCity: {
    color: "rgba(255,255,255,0.92)",
    fontFamily: "barlow-medium",
    fontSize: 13,
  },
  heroTitle: {
    color: "#0f172a",
    fontFamily: "barlow-semibold",
    fontSize: 22,
    marginTop: 12,
    lineHeight: 28,
  },
  heroSubtitle: {
    color: "#0f172a",
    fontFamily: "barlow-medium",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  heroActions: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  heroTags: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  heroTag: {
    color: "white",
    fontFamily: "barlow-medium",
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  heroButton: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#0A2240",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  heroButtonText: {
    color: "#0A2240",
    fontFamily: "barlow-semibold",
    fontSize: 14,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  initialsBadge: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.16)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(15,23,42,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  greetingText: {
    color: "white",
    fontFamily: "barlow-extrabold",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  brandTitle: {
    position: "absolute",
    left: "30%",
    transform: [{ translateX: -45 }],
    color: "#0f172a",
    fontFamily: "bebas-regular",
    fontSize: 30,
    letterSpacing: 2,
  },
  logoContainer: {
    marginTop: 10,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "rgba(36,44,68,0.08)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  cityLogo: {
    width: 150,
    height: 70,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    width: "100%",
    alignSelf: "center",
    flexWrap: "wrap",
  },
  sponsorLabel: {
    fontFamily: "barlow-medium",
    fontSize: 15,
    color: "#1f2937",
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: "barlow-semibold",
    fontSize: 18,
    color: "#0A2240",
  },
  sectionSubtitle: {
    fontFamily: "barlow-regular",
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },
  sectionPill: {
    fontFamily: "barlow-medium",
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillCommunity: {
    backgroundColor: "#e0f2fe",
    color: "#0ea5e9",
  },
  pillAcademy: {
    backgroundColor: "#f3e8ff",
    color: "#7c3aed",
  },
  pillNews: {
    backgroundColor: "#fef9c3",
    color: "#ca8a04",
  },
});
