import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DrawerLayout from "react-native-gesture-handler/DrawerLayout";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Academy from "@/components/home/Academy";
import Header from "@/components/Header";
import { useRouter } from "expo-router";
import DrawerContent from "@/components/DrawerContent";
import SignOutDialog from "@/components/SignOutDialog";
import CategoryIcons from "@/components/home/Category";
import News from "@/components/home/News";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useLocationBucket,
  type LocationUpdateError,
} from "@/src/hooks/useLocationBucket";

export default function HomeScreen() {
  const drawerRef = useRef<DrawerLayout>(null);
  const router = useRouter();
  const [isSignOutVisible, setIsSignOutVisible] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [lastPlaceLabel, setLastPlaceLabel] = useState<string | null>(null);
  const { updateFromDevice, topBucket, loadTopBucket } = useLocationBucket();

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

  const savedLocationLabel = useMemo(() => {
    if (lastPlaceLabel) {
      return lastPlaceLabel;
    }

    if (topBucket) {
      return `${topBucket.latCenter.toFixed(2)}, ${topBucket.lngCenter.toFixed(
        2
      )}`;
    }

    return null;
  }, [lastPlaceLabel, topBucket]);

  const handleLocationUpdate = useCallback(async () => {
    if (isUpdatingLocation) {
      return;
    }

    setIsUpdatingLocation(true);

    try {
      const result = await updateFromDevice();

      if (!result) {
        return;
      }

      if (result.place) {
        const label =
          result.place.formattedAddress ||
          [result.place.neighborhood, result.place.city]
            .filter(Boolean)
            .join(", ");

        if (label) {
          setLastPlaceLabel(label);
        }

        Alert.alert(
          "Ubicación actualizada",
          label
            ? `Ahora te mostraremos noticias y canchas cercanas a ${label}.`
            : "Guardamos tu ubicación para personalizar el contenido."
        );
      } else {
        Alert.alert(
          "Ubicación actualizada",
          "Guardamos tu ubicación para personalizar el contenido."
        );
      }
    } catch (error) {
      const err = error as LocationUpdateError;
      let message =
        "Ocurrió un error al obtener tu ubicación. Inténtalo nuevamente más tarde.";

      switch (err.code) {
        case "services-disabled":
          message =
            "Activa los servicios de ubicación en tu dispositivo para poder mostrarte contenido cercano.";
          break;
        case "permission-denied":
          message =
            'Necesitamos tu permiso para acceder a la ubicación. Puedes activarlo cuando quieras desde el botón de "Actualizar ubicación".';
          break;
        case "location-unavailable":
          message =
            "No pudimos obtener tu ubicación actual. Verifica tu conexión o intenta nuevamente en unos minutos.";
          break;
        default:
          break;
      }

      Alert.alert("No pudimos actualizar tu ubicación", message);
    } finally {
      setIsUpdatingLocation(false);
    }
  }, [isUpdatingLocation, updateFromDevice]);

  useEffect(() => {
    loadTopBucket();
  }, [loadTopBucket]);

  useEffect(() => {
    const LOCATION_OPT_IN_KEY = "@millenium:location-opt-in";

    const checkPrompt = async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCATION_OPT_IN_KEY);
        if (stored) {
          return;
        }

        Alert.alert(
          "Activa tu ubicación",
          "Tu ubicación nos ayuda a mostrarte noticias locales y canchas cercanas.",
          [
            {
              text: "Más tarde",
              style: "cancel",
              onPress: () => {
                void AsyncStorage.setItem(LOCATION_OPT_IN_KEY, "dismissed");
                Alert.alert(
                  "Recordatorio",
                  'Podrás activar la ubicación cuando quieras desde el botón "Actualizar ubicación".'
                );
              },
            },
            {
              text: "Activar ahora",
              onPress: () => {
                void AsyncStorage.setItem(LOCATION_OPT_IN_KEY, "accepted");
                void handleLocationUpdate();
              },
            },
          ]
        );
      } catch (error) {
        console.warn("No se pudo verificar el onboarding de ubicación", error);
      }
    };

    checkPrompt();
  }, [handleLocationUpdate]);

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
        <View style={{ flex: 1 }}>
          <Header onMenuPress={() => drawerRef.current?.openDrawer()} />
          <FlatList
            data={[{ key: "home" }]}
            renderItem={() => (
              <>
                <View style={styles.locationCard}>
                  <Text style={styles.locationTitle}>
                    Personaliza tu contenido
                  </Text>
                  <Text style={styles.locationDescription}>
                    Activa la ubicación para ver noticias locales y canchas
                    cercanas.
                  </Text>
                  {savedLocationLabel && (
                    <Text style={styles.locationStatus}>
                      Última ubicación guardada: {savedLocationLabel}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.locationButton,
                      isUpdatingLocation && styles.locationButtonDisabled,
                    ]}
                    onPress={handleLocationUpdate}
                    activeOpacity={0.85}
                    disabled={isUpdatingLocation}
                  >
                    {isUpdatingLocation ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.locationButtonLabel}>
                        Actualizar ubicación
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
                <CategoryIcons />
                <Academy />
                <News />
              </>
            )}
            keyExtractor={(item) => item.key}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
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
  locationCard: {
    backgroundColor: "#0A2240",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  locationTitle: {
    color: "#FFFFFF",
    fontFamily: "barlow-semibold",
    fontSize: 18,
  },
  locationDescription: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "barlow-regular",
    fontSize: 14,
    lineHeight: 20,
  },
  locationStatus: {
    color: "#A5B4FC",
    fontFamily: "barlow-medium",
    fontSize: 13,
  },
  locationButton: {
    backgroundColor: "#F02B44",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  locationButtonDisabled: {
    opacity: 0.7,
  },
  locationButtonLabel: {
    color: "#FFFFFF",
    fontFamily: "barlow-semibold",
    fontSize: 16,
  },
});
