import { Redirect, Tabs } from "expo-router";
import React from "react";
import {
  View,
  Platform,
  StatusBar,
  Keyboard,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import {
  MaterialCommunityIcons,
  FontAwesome,
  FontAwesome6,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCitySelection } from "@/hooks/useCitySelection";
import { CITY_OPTIONS } from "@/constants/cities";
import { SafeAreaView } from "react-native-safe-area-context";
import CitySelectionScreen from "@/components/city/CitySelectionScreen";
import TabIcon from "@/components/navigation/TabIcon";
import { TOURNAMENTS_ENABLED } from "@/config/FeatureFlags";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

const TAB_BAR_LABEL_STYLE: TextStyle = {
  zIndex: 100,
  fontSize: 8,
  marginBottom: Platform.OS === "ios" ? 0 : -4,
};

const TAB_BAR_BASE_STYLE: ViewStyle = {
  position: "relative",
  height: 45,
  marginBottom: 0,
  backgroundColor: "white",
  paddingBottom: Platform.OS === "ios" ? 15 : 5,
};

const BOTTOM_BANNER_COLORS: string[] = ["#f1f6ff", "#e0ecff"];
const BOTTOM_BANNER_START: [number, number] = [0, 0];
const BOTTOM_BANNER_END: [number, number] = [1, 1];

/* ================================================
   LAYOUT CON TABS SEGÚN CIUDAD SELECCIONADA
=================================================== */

export default function CallRoutesLayout() {
  const { isSignedIn } = useAuth();
  const [isKeyboardVisible, setKeyboardVisible] = React.useState(false);
  const {
    selectedCity,
    isLoading: isCityLoading,
  } = useCitySelection();

  const selectedCityInfo = React.useMemo(
    () => CITY_OPTIONS.find((option) => option.id === selectedCity),
    [selectedCity]
  );

  const tabBarStyle = React.useMemo<StyleProp<ViewStyle>>(
    () => ({
      ...TAB_BAR_BASE_STYLE,
      display: isKeyboardVisible ? "none" : "flex",
    }),
    [isKeyboardVisible]
  );

  const screenOptions = React.useMemo<BottomTabNavigationOptions>(
    () => ({
      header: () => null,
      tabBarActiveTintColor: "#242c44",
      tabBarLabelStyle: TAB_BAR_LABEL_STYLE,
      tabBarStyle,
      lazy: true,
      detachInactiveScreens: true,
    }),
    [tabBarStyle]
  );

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  if (!isSignedIn) {
    return <Redirect href={"/(auth)/sign-in"} />;
  }

  if (isCityLoading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loaderText}>
          Preparando tu experiencia...
        </Text>
      </SafeAreaView>
    );
  }

  if (!selectedCity) {
    return <CitySelectionScreen />;
  }

  const selectedCityTitle = selectedCityInfo?.title ?? selectedCity;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="default" />
      <View style={styles.tabsWrapper}>
        <Tabs screenOptions={screenOptions}>
          <Tabs.Screen
            name="Home"
            options={{
              title: "COMUNIDAD",
              tabBarIcon: ({ color, focused }) => (
                <TabIcon
                  focused={focused}
                  color={color}
                  icon={MaterialCommunityIcons}
                  iconName="home-city"
                  size={24}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="Fields"
            options={{
              title: "CANCHAS",
              tabBarIcon: ({ color, focused }) => (
                <TabIcon
                  focused={focused}
                  color={color}
                  icon={MaterialCommunityIcons}
                  iconName="soccer-field"
                  size={24}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="Conecta"
            options={{
              title: "CONECTA",
              tabBarIcon: ({ color, focused }) => (
                <TabIcon
                  focused={focused}
                  color={color}
                  icon={FontAwesome}
                  iconName="comments"
                  size={24}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="Metodology"
            options={{
              title: "CLUB FC",
              headerTitle: "Club",
              tabBarIcon: ({ color, focused }) => (
                <TabIcon
                  focused={focused}
                  color={color}
                  icon={FontAwesome}
                  iconName="soccer-ball-o"
                  size={24}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="Profile"
            options={{
              title: "REGISTRO",
              headerTitle: "Registro para selectivo",
              tabBarIcon: ({ color, focused }) => (
                <TabIcon
                  focused={focused}
                  color={color}
                  icon={FontAwesome6}
                  iconName="user-ninja"
                  size={24}
                />
              ),
            }}
            listeners={{
              tabPress: (e) => {
                if (!TOURNAMENTS_ENABLED) {
                  e.preventDefault();
                  Alert.alert(
                    "Inscripciones cerradas",
                    "Por el momento están cerradas las inscripciones para torneos locales.",
                    [{ text: "Entendido" }]
                  );
                }
              },
            }}
          />
        </Tabs>

        {!isKeyboardVisible && <BottomBanner projectTitle={selectedCityTitle} />}
      </View>
    </SafeAreaView>
  );
}

type BottomBannerProps = {
  projectTitle?: string | null;
};

function BottomBannerComponent({ projectTitle }: BottomBannerProps) {
  return (
    <LinearGradient
      colors={BOTTOM_BANNER_COLORS}
      start={BOTTOM_BANNER_START}
      end={BOTTOM_BANNER_END}
      style={styles.bottomBannerContainer}
    >
      <View style={styles.bottomBannerHairline} />

      <View style={styles.bottomBannerTitleRow}>
        <Text style={styles.bottomBannerTitle}>
          Proyecto: {projectTitle ?? ""}
        </Text>
      </View>

      <View style={styles.bottomBannerSeparator} />
    </LinearGradient>
  );
}

const BottomBanner = React.memo(BottomBannerComponent);
BottomBanner.displayName = "BottomBanner";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
    backgroundColor: "white",
  },
  tabsWrapper: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
  },
  loaderText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    marginTop: 16,
  },
  bottomBannerContainer: {
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: Platform.OS === "ios" ? 10 : 14,
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginHorizontal: 12,
    marginBottom: Platform.OS === "ios" ? 6 : 8,
    shadowColor: "#1e2a4d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  bottomBannerHairline: {
    width: "100%",
    height: 1.5,
    backgroundColor: "rgba(36, 44, 68, 0.18)",
    marginBottom: 4,
  },
  bottomBannerTitleRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  bottomBannerTitle: {
    color: "#1f2a44",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  bottomBannerSeparator: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(36, 44, 68, 0.16)",
    marginBottom: 8,
  },
});
