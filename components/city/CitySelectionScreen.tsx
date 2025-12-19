import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CITY_OPTIONS, type CityId } from "@/constants/cities";
import { useCitySelection } from "@/hooks/useCitySelection";

const CitySelectionScreen = () => {
  const { selectCity } = useCitySelection();
  const [highlightedCity, setHighlightedCity] = React.useState<CityId | null>(
    null
  );

  const selectableCities = React.useMemo(
    () => CITY_OPTIONS.filter((option) => option.id !== "manabi"),
    []
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.kicker}>Ciudad FC</Text>
        <Text style={styles.title}>Elige tu ciudad</Text>
        <Text style={styles.subtitle}>Contenido y canchas según tu zona.</Text>

        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={18} color="#0ea5e9" />
          <Text style={styles.infoText}>Puedes cambiarla luego.</Text>
        </View>

        <View style={styles.list}>
          {selectableCities.map((option) => {
            const isActive = highlightedCity === option.id;
            return (
              <Pressable
                key={option.id}
                disabled={isActive}
                onPress={() => handleSelect(option.id)}
                style={({ pressed }) => [
                  styles.card,
                  isActive && styles.cardActive,
                  pressed && !isActive && styles.cardPressed,
                ]}
              >
                <LinearGradient
                  colors={[...option.gradient]}
                  start={[0, 0]}
                  end={[1, 1]}
                  style={styles.cardHeader}
                >
                  <Text style={styles.cardTitle}>{option.title}</Text>
                  <Text style={styles.cardPill}>
                    {isActive ? "Aplicando" : "Elegir"}
                  </Text>
                </LinearGradient>

                <View style={styles.cardBody}>
                  <Text style={styles.cardDescription}>
                    {option.description}
                  </Text>

                  {isActive && (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#0A2240" size="small" />
                      <Text style={styles.loadingText}>
                        Aplicando...
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f8fb",
  },
  container: {
    flex: 1,
    backgroundColor: "#f6f8fb",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 12 : 12,
    paddingBottom: 32,
    gap: 12,
  },
  kicker: {
    fontSize: 12,
    fontFamily: "barlow-medium",
    letterSpacing: 2,
    color: "#0f172a",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    fontFamily: "barlow-medium",
    color: "#0A2240",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "barlow-regular",
    color: "#475569",
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#e0f2fe",
    borderColor: "rgba(14,165,233,0.2)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "barlow-medium",
    color: "#0f172a",
  },
  list: {
    gap: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardActive: {
    borderColor: "rgba(14,165,233,0.55)",
    backgroundColor: "rgba(14,165,233,0.05)",
    shadowOpacity: 0.08,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
    opacity: 0.97,
  },
  cardHeader: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 21,
    fontFamily: "barlow-medium",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.12)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardPill: {
    fontSize: 12,
    fontFamily: "barlow-medium",
    color: "#082f49",
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    minWidth: 78,
    textAlign: "center",
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: "barlow-regular",
    color: "#475569",
    lineHeight: 20,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: "barlow-medium",
    color: "#0A2240",
  },
});

export default CitySelectionScreen;
