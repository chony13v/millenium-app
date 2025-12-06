import { Redirect, Tabs } from "expo-router";
import React from "react";
import {
  View,
  Platform,
  StatusBar,
  Keyboard,
  Text,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import {
  MaterialCommunityIcons,
  FontAwesome,
  FontAwesome6,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCitySelection } from "@/hooks/useCitySelection";
import { CITY_OPTIONS, type CityId } from "@/constants/cities";
import { SafeAreaView } from "react-native-safe-area-context";
import CitySelectionScreen from "@/components/city/CitySelectionScreen";
import TabIcon from "@/components/navigation/TabIcon";

/* ================================================
   LAYOUT CON TABS SEGÚN CIUDAD SELECCIONADA
=================================================== */

export default function CallRoutesLayout() {
  const { isSignedIn } = useAuth();
  const [isKeyboardVisible, setKeyboardVisible] = React.useState(false);
  const {
    selectedCity,
    isLoading: isCityLoading,
    clearCity,
  } = useCitySelection();

  const selectedCityInfo = React.useMemo(
    () => CITY_OPTIONS.find((option) => option.id === selectedCity),
    [selectedCity]
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
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
        }}
      >
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: 16,
            marginTop: 16,
          }}
        >
          Preparando tu experiencia...
        </Text>
      </SafeAreaView>
    );
  }

  if (!selectedCity) {
    return <CitySelectionScreen />;
  }

  return (
    <SafeAreaView
      style={{ flex: 1, paddingBottom: 0, backgroundColor: "white" }}
    >
      <StatusBar barStyle="default" />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={({ route }) => ({
            header: () => null,
            tabBarActiveTintColor: "#242c44",
            tabBarLabelStyle: {
              zIndex: 100,
              fontSize: 8,
              marginBottom: Platform.OS === "ios" ? 0 : -4,
            },
            tabBarStyle: {
              position: "relative",
              height: 45,
              marginBottom: 0,
              backgroundColor: "white",
              paddingBottom: Platform.OS === "ios" ? 15 : 5,
              display: isKeyboardVisible ? "none" : "flex",
            },
          })}
        >
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
          />
        </Tabs>

        {!isKeyboardVisible && (
          <LinearGradient
            colors={["#f1f6ff", "#e0ecff"]}
            start={[0, 0]}
            end={[1, 1]}
            style={{
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
            }}
          >
            {/* ── Top hairline (full width) */}
            <View
              style={{
                width: "100%",
                height: 1.5,
                backgroundColor: "rgba(36, 44, 68, 0.18)",
                marginBottom: 4,
              }}
            />

            {/* Title + action */}
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color: "#1f2a44",
                  fontWeight: "700",
                  fontSize: 13,
                  letterSpacing: 0.3,
                }}
              >
                Proyecto: {selectedCityInfo?.title ?? selectedCity}
              </Text>

              {/* 
              <Pressable
                onPress={clearCity}
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: pressed
                    ? "rgba(36,44,68,0.12)"
                    : "rgba(36,44,68,0.08)",
                })}
              >
                <Text
                  style={{
                    color: "#1f2a44",
                    fontSize: 12,
                    fontWeight: "600",
                    letterSpacing: 0.4,
                  }}
                >
                  Cambiar ciudad
                </Text>
              </Pressable>

                    */}
            </View>

            {/* ── Separator (full width) */}
            <View
              style={{
                width: "100%",
                height: 1,
                backgroundColor: "rgba(36, 44, 68, 0.16)",
                marginBottom: 8,
              }}
            />

          </LinearGradient>
        )}
      </View>
    </SafeAreaView>
  );
}
