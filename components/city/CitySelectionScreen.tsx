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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.kicker}>Ciudad FC Academy</Text>
        <Text style={styles.title}>Elige tu ciudad</Text>
        <Text style={styles.subtitle}>
          Personalizamos la comunidad, canchas y noticias según tu ubicación.
        </Text>

        <View style={styles.tipCard}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Recomendado</Text>
          </View>
          <Text style={styles.tipTitle}>Guarda tu selección</Text>
          <Text style={styles.tipBody}>
            Quedará registrada para tus próximos ingresos. Siempre podrás
            cambiarla más adelante.
          </Text>
        </View>

        <View style={styles.list}>
          {CITY_OPTIONS.map((option) => {
            const isActive = highlightedCity === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => handleSelect(option.id)}
                style={({ pressed }) => [
                  styles.card,
                  isActive && styles.cardActive,
                  pressed && styles.cardPressed,
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
                    {isActive ? "Cargando" : "Seleccionar"}
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
                        Personalizando tu experiencia...
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
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 12 : 12,
    paddingBottom: 28,
    gap: 14,
  },
  kicker: {
    fontSize: 12,
    fontFamily: "barlow-medium",
    letterSpacing: 2,
    color: "#0ea5e9",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    fontFamily: "barlow-medium",
    color: "#0A2240",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "barlow-regular",
    color: "#475569",
    lineHeight: 22,
  },
  tipCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: "#0ea5e9",
    fontFamily: "barlow-medium",
    fontSize: 12,
  },
  tipTitle: {
    fontSize: 18,
    fontFamily: "barlow-medium",
    color: "#0f172a",
  },
  tipBody: {
    fontSize: 14,
    fontFamily: "barlow-regular",
    color: "#475569",
    lineHeight: 20,
  },
  list: {
    gap: 14,
    marginTop: 6,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardActive: {
    borderColor: "rgba(14,165,233,0.4)",
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: "barlow-medium",
    color: "white",
  },
  cardPill: {
    fontSize: 12,
    fontFamily: "barlow-medium",
    color: "#0f172a",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  cardBody: {
    padding: 16,
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
    fontSize: 13,
    fontFamily: "barlow-medium",
    color: "#0A2240",
  },
});

export default CitySelectionScreen;
