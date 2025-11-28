import React, { useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DrawerLayout from "react-native-gesture-handler/DrawerLayout";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import Academy from "@/components/home/Academy";
import Header from "@/components/Header";
import { useRouter } from "expo-router";
import DrawerContent from "@/components/DrawerContent";
import SignOutDialog from "@/components/SignOutDialog";
import CategoryIcons from "@/components/home/Category";
import News from "@/components/home/News";
import { useCitySelection } from "@/hooks/useCitySelection";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CITY_OPTIONS } from "@/constants/cities";

export default function HomeScreen() {
  const drawerRef = useRef<DrawerLayout>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedCity } = useCitySelection();
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
          <Header onMenuPress={() => drawerRef.current?.openDrawer()} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: 32 + insets.bottom },
            ]}
          >
            <LinearGradient
              colors={["#1e3a8a", "#1e3a8a"]}
              start={[0, 0]}
              end={[1, 1]}
              style={styles.heroCard}
            >
              <View style={styles.heroBadgeRow}>
                <Text style={styles.heroBadge}>Ciudad FC</Text>
                <Text style={styles.heroCity}>
                  {selectedCityInfo?.title ?? "Tu comunidad"}
                </Text>
              </View>

              <Text style={styles.heroTitle}>
                Todo lo que pasa en tu comunidad
              </Text>
              <Text style={styles.heroSubtitle}>
                Participa y vive el deporte en tu ciudad con Ciudad FC: noticias,
                academia y enlaces oficiales en un solo lugar.
              </Text>

              <View style={styles.heroActions}>
                <View style={styles.heroTags}>
                  <Text style={styles.heroTag}>Novedades locales</Text>
                  <Text style={styles.heroTag}>Academia 2025</Text>
                  <Text style={styles.heroTag}>Canales oficiales</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.heroButton}
                  onPress={handleGoToConecta}
                >
                  <Text style={styles.heroButtonText}>Abrir Ciudad FC</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Canales oficiales</Text>
                  <Text style={styles.sectionSubtitle}>
                    Enlaces directos para no perderte nada.
                  </Text>
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
                <Text style={styles.sectionTitle}>Academia Ciudad FC</Text>
                <Text style={styles.sectionSubtitle}>
                  Videos y entrenamientos curados para ti.
                </Text>
              </View>
                <Text style={[styles.sectionPill, styles.pillAcademy]}>
                  Academia
                </Text>
              </View>
              <Academy />
            </View>

            <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Noticias</Text>
                <Text style={styles.sectionSubtitle}>
                    Actualizaciones del proyecto{" "}
                    {selectedCityInfo?.title ?? "Ciudad FC"}
                </Text>
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
    paddingTop: 10,
    paddingHorizontal: 16,
    gap: 16,
  },
  heroCard: {
    marginTop: 6,
    padding: 16,
    borderRadius: 18,
    width: "100%",
    minHeight: 150,
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    color: "white",
    fontFamily: "barlow-semibold",
    fontSize: 22,
    marginTop: 8,
    lineHeight: 28,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: "barlow-regular",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
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
  sectionCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
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
