import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { CITY_OPTIONS, type CityId } from "@/constants/cities";
import { useCitySelection } from "@/hooks/useCitySelection";

const CitySelectionScreen = () => {
  const { selectCity } = useCitySelection();
  const [highlightedCity, setHighlightedCity] = React.useState<CityId | null>(
    null
  );

  const handleSelect = React.useCallback(
    async (cityId: CityId) => {
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

  const TOP_SPACING =
    (Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0) + 8;

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#111827"]}
      start={[0, 0]}
      end={[1, 1]}
      style={{ flex: 1, paddingTop: TOP_SPACING }}
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
          {/* HEADER */}
          <View style={{ gap: 16 }}>
            <Text
              style={{
                color: "#60a5fa",
                fontWeight: "700",
                letterSpacing: 2,
                fontSize: 12,
                textTransform: "uppercase",
              }}
            >
              BIENVENIDO A MILLENIUM ACADEMY
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

          {/* CITY LIST */}
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
                    colors={[...option.gradient]}
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

export default CitySelectionScreen;
