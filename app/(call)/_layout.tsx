import { Redirect, Tabs } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  Image,
  View,
  Platform,
  StatusBar,
  Keyboard,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import {
  MaterialCommunityIcons,
  FontAwesome,
  FontAwesome6,
} from "@expo/vector-icons";
import { useWarmUpBrowser } from "@/components/SignInWithOAuth";
import { LinearGradient } from "expo-linear-gradient";
import { useCitySelection } from "@/hooks/useCitySelection";

type CityOption = {
  id: string;
  title: string;
  description: string;
  gradient: [string, string];
};

const CITY_OPTIONS: CityOption[] = [
  {
    id: "manta",
    title: "Manta",
    description: "Capital del sol y sede principal de la academia.",
    gradient: ["#1d4ed8", "#38bdf8"],
  },
  {
    id: "portoviejo",
    title: "Portoviejo",
    description: "La ciudad jardín que vibra con el fútbol formativo.",
    gradient: ["#7c3aed", "#a855f7"],
  },
  {
    id: "chone",
    title: "Chone",
    description: "Talento emergente listo para brillar en cada torneo.",
    gradient: ["#22c55e", "#86efac"],
  },
];

const CitySelectionScreen = () => {
  const { selectCity } = useCitySelection();
  const [highlightedCity, setHighlightedCity] = React.useState<string | null>(
    null
  );

  const handleSelect = React.useCallback(
    async (cityId: string) => {
      setHighlightedCity(cityId);
      try {
        await selectCity(cityId);
      } catch (error) {
        console.warn("No se pudo seleccionar la ciudad", error);
        setHighlightedCity(null);
      }
    },
    [selectCity]
  );

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#111827"]}
      start={[0, 0]}
      end={[1, 1]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingVertical: 28,
            justifyContent: "space-between",
          }}
        >
          <View style={{ gap: 16 }}>
            <Text
              style={{
                color: "#60a5fa",
                fontWeight: "600",
                letterSpacing: 2,
                fontSize: 12,
                textTransform: "uppercase",
              }}
            >
              Bienvenido a Millenium Academy
            </Text>
            <Text
              style={{
                color: "white",
                fontSize: 28,
                fontWeight: "800",
              }}
            >
              ¿Dónde quieres jugar hoy?
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 15,
                lineHeight: 22,
              }}
            >
              Selecciona la ciudad para personalizar la comunidad, canchas y
              eventos destacados.
            </Text>
            <View
              style={{
                backgroundColor: "rgba(96,165,250,0.12)",
                borderRadius: 14,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: "rgba(96,165,250,0.35)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "700",
                    fontSize: 14,
                  }}
                >
                  1
                </Text>
              </View>
              <Text
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 13,
                  lineHeight: 18,
                  flex: 1,
                }}
              >
                Esta selección se guardará para tus próximos ingresos, pero
                siempre podrás cambiarla cuando lo necesites.
              </Text>
            </View>
          </View>
          <View style={{ flex: 1, marginTop: 28 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {CITY_OPTIONS.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => handleSelect(option.id)}
                  style={({ pressed }) => [
                    {
                      width: "100%",
                      borderRadius: 20,
                      overflow: "hidden",
                      marginBottom: 16,
                      borderWidth: highlightedCity === option.id ? 2 : 0,
                      borderColor:
                        highlightedCity === option.id
                          ? "rgba(255,255,255,0.35)"
                          : "transparent",
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={option.gradient}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={{ padding: 20 }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 22,
                        fontWeight: "700",
                        marginBottom: 6,
                      }}
                    >
                      {option.title}
                    </Text>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.85)",
                        fontSize: 14,
                        lineHeight: 20,
                      }}
                    >
                      {option.description}
                    </Text>
                    {highlightedCity === option.id && (
                      <View
                        style={{
                          marginTop: 18,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <ActivityIndicator color="white" />
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.85)",
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          Personalizando tu experiencia...
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

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

  useWarmUpBrowser();

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

  const CustomTabIcon = ({
    focused,
    color,
    icon: Icon,
    iconName,
    size,
  }: {
    focused: boolean;
    color: string;
    icon: any;
    iconName: string;
    size: number;
  }) => {
    return (
      <View style={{ alignItems: "center" }}>
        {focused && (
          <View
            style={{
              position: "absolute",
              top: -8,
              width: 45,
              height: 3,
              backgroundColor: color,
              borderTopLeftRadius: 1,
              borderTopRightRadius: 1,
              borderBottomLeftRadius: 4,
              borderBottomRightRadius: 4,
            }}
          />
        )}
        <Icon name={iconName} size={size} color={color} />
      </View>
    );
  };

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
            name="home"
            options={{
              title: "COMUNIDAD",
              tabBarIcon: ({ color, focused }) => (
                <CustomTabIcon
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
            name="fields"
            options={{
              title: "CANCHAS",
              tabBarIcon: ({ color, focused }) => (
                <CustomTabIcon
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
            name="metodology"
            options={{
              title: "CLUB",
              headerTitle: "Club",
              tabBarIcon: ({ color, focused }) => (
                <CustomTabIcon
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
            name="profile"
            options={{
              title: "REGISTRO",
              headerTitle: "Registro para selectivo",
              tabBarIcon: ({ color, focused }) => (
                <CustomTabIcon
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
              paddingTop: 5,
              paddingBottom: Platform.OS === "ios" ? 10 : 16,
              paddingHorizontal: 10,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              marginHorizontal: 18,
              marginBottom: Platform.OS === "ios" ? 6 : 8,
              shadowColor: "#1e2a4d",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <View
              style={{
                width: "100%",
                height: 1.5,
                backgroundColor: "rgba(36, 44, 68, 0.18)",
                marginBottom: 3,
              }}
            />

            <View
              style={{
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
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
            </View>
            <View
              style={{
                width: "80%",
                height: 1.25,
                backgroundColor: "rgba(36, 44, 68, 0.18)",
                marginBottom: 10,
              }}
            />
            <Image
              source={require("../../assets/images/manabi_logo.png")}
              style={{
                width: 340,
                height: 64,
                resizeMode: "contain",
              }}
            />
          </LinearGradient>
        )}
      </View>
    </SafeAreaView>
  );
}
