import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useUser, useAuth } from "@clerk/clerk-expo";
import LoadingBall from "@/components/LoadingBall";
import { useCitySelection } from "@/hooks/useCitySelection";
import { updateUserLocationBucket } from "@/services/location/updateUserLocationBucket";
import { useFieldsData } from "@/hooks/useFieldsData";
import FieldCard from "@/components/fields/FieldCard";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { CITY_OPTIONS } from "@/constants/cities";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Field() {
  const { selectedCity, hasHydrated } = useCitySelection();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const insets = useSafeAreaInsets();

  const {
    sortedFieldList,
    loading,
    distances,
    imageLoading,
    imageError,
    prefetchStatus,
    handleImageLoadStart,
    handleImageLoadEnd,
    handleImageError,
    setUserLocation,
    requestLocation,
  } = useFieldsData(selectedCity, hasHydrated);

  const selectedCityInfo = useMemo(
    () => CITY_OPTIONS.find((city) => city.id === selectedCity),
    [selectedCity]
  );

  const ensureFirebaseSession = useCallback(async () => {
    const auth = getAuth();
    if (auth.currentUser) return;

    const token = await getToken({ template: "integration_firebase" });
    if (!token) {
      throw new Error("No se pudo obtener el token de Firebase.");
    }

    await signInWithCustomToken(auth, token);
  }, [getToken]);

  const handleUpdateLocationBucket = async () => {
    if (!user?.id) {
      Alert.alert(
        "Inicia sesión",
        "Necesitas iniciar sesión para actualizar tu ubicación."
      );
      return;
    }

    if (!selectedCity) {
      Alert.alert(
        "Selecciona una ciudad",
        "Elige una ciudad antes de actualizar tu ubicación."
      );
      return;
    }

    try {
      setIsUpdatingLocation(true);
      await ensureFirebaseSession();
      const result = await updateUserLocationBucket({
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress,
        cityId: selectedCity,
      });

      setUserLocation(result.coords);

      Alert.alert(
        "Ubicación actualizada",
        "Gracias por compartir tu ubicación para mejorar las recomendaciones."
      );
    } catch (error) {
      console.error("Error al actualizar la ubicación del usuario:", error);
      Alert.alert(
        "No se pudo actualizar",
        "Intenta nuevamente más tarde o verifica los permisos de ubicación."
      );
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const listHeader = useMemo(
    () => (
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={["#1e3a8a", "#1e3a8a"]}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.heroCard}
        >
          <View style={styles.heroRow}>
            <Text style={styles.heroBadge}>Centros deportivos</Text>
            <Text style={styles.heroCity}>
              {selectedCityInfo?.title ?? "Tu ciudad"}
            </Text>
          </View>
          <Text style={styles.heroSubtitle}>
            Comparte tu ubicación aproximada para ordenar los centros por
            cercanía y guardar tus favoritas.
          </Text>
          <TouchableOpacity
            style={[
              styles.heroButton,
              isUpdatingLocation && styles.heroButtonDisabled,
            ]}
            onPress={handleUpdateLocationBucket}
            disabled={isUpdatingLocation}
            activeOpacity={0.9}
          >
            <Text style={styles.heroButtonText}>
              {isUpdatingLocation ? "Actualizando..." : "Actualizar ubicación"}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    ),
    [
      handleUpdateLocationBucket,
      insets.top,
      isUpdatingLocation,
      selectedCityInfo?.title,
      sortedFieldList.length,
    ]
  );

  if (!hasHydrated) {
    return <LoadingBall text="Cargando ciudades..." />;
  }

  if (!selectedCity) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateTitle}>Selecciona una ciudad</Text>
        <Text style={styles.emptyStateDescription}>
          Elige una ciudad desde la pantalla anterior para ver los centros
          deportivos disponibles.
        </Text>
      </View>
    );
  }

  if (loading) {
    return <LoadingBall text="Cargando campos deportivos..." />;
  }

  if (sortedFieldList.length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateTitle}>
          No hay centros deportivos disponibles
        </Text>
        <Text style={styles.emptyStateDescription}>
          Aún no tenemos canchas registradas para esta ciudad. Vuelve más tarde.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      ListHeaderComponent={listHeader}
      data={sortedFieldList}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <FieldCard
          item={item}
          distance={distances[item.id]}
          isImageLoading={imageLoading[item.id]}
          isImageError={imageError[item.id]}
          hasPrefetchedImage={prefetchStatus[item.id] === "loaded"}
          onLoadStart={handleImageLoadStart}
          onLoadEnd={handleImageLoadEnd}
          onError={handleImageError}
        />
      )}
      style={styles.list}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: 24 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
      scrollEnabled={true}
      removeClippedSubviews={true}
      maxToRenderPerBatch={3}
      initialNumToRender={3}
      windowSize={3}
      onRefresh={requestLocation}
      refreshing={false}
    />
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    gap: 14,
    paddingTop: 0,
    paddingHorizontal: 0,
    width: "100%",
    paddingBottom: 14,
  },
  heroCard: {
    width: "100%",
    borderRadius: 18,
    padding: 16,
    marginTop: 6,
    minHeight: 170,
    gap: 10,
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.14)",
    color: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontFamily: "barlow-semibold",
    fontSize: 12,
    letterSpacing: 0.4,
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
    marginTop: 12,
    lineHeight: 28,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: "barlow-regular",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  heroFooter: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
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
    backgroundColor: "rgba(255,255,255,0.16)",
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
  heroButtonDisabled: {
    opacity: 0.7,
  },
  heroButtonText: {
    color: "#0A2240",
    fontFamily: "barlow-semibold",
    fontSize: 14,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: "barlow-medium",
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
    fontFamily: "barlow-semibold",
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e0f2fe",
    color: "#0ea5e9",
  },
  list: {
    backgroundColor: "#f8fafc",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#f8fafc",
  },
  emptyStateTitle: {
    fontFamily: "barlow-semibold",
    fontSize: 20,
    color: "#0A2240",
    textAlign: "center",
    marginBottom: 10,
  },
  emptyStateDescription: {
    fontFamily: "barlow-regular",
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
  },
});
