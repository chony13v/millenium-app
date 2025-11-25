import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import LoadingBall from "@/components/LoadingBall";
import { useCitySelection } from "@/hooks/useCitySelection";
import { updateUserLocationBucket } from "@/services/location/updateUserLocationBucket";
import { useFieldsData } from "@/hooks/useFieldsData";
import FieldCard from "@/components/fields/FieldCard";

export default function Field() {
  const { selectedCity, hasHydrated } = useCitySelection();
  const { user } = useUser();
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

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
        <View style={styles.consentCard}>
          <Text style={styles.consentTitle}>Permite ver canchas cercanas</Text>
          <Text style={styles.consentDescription}>
            Con tu consentimiento, guardamos una versión aproximada de tu
            ubicación para mostrarte centros deportivos cercanos.
          </Text>

          <TouchableOpacity
            style={[
              styles.consentButton,
              isUpdatingLocation && { opacity: 0.7 },
            ]}
            onPress={handleUpdateLocationBucket}
            disabled={isUpdatingLocation}
          >
            <Text style={styles.consentButtonText}>
              {isUpdatingLocation ? "Actualizando..." : "Actualizar ahora"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Centros deportivos</Text>
      </View>
    ),
    [handleUpdateLocationBucket, isUpdatingLocation]
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
      style={[styles.list, { backgroundColor: "white" }]}
      contentContainerStyle={styles.listContent}
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
    gap: 12,
  },
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  title: {
    fontFamily: "barlow-regular",
    fontSize: 35,
    color: "#0A2240",
    paddingVertical: 10,
    marginBottom: 5,
    textAlign: "center",
    width: "100%",
  },

  list: {
    paddingHorizontal: 10,
  },
  listContent: {
    paddingBottom: 80,
  },
  consentCard: {
    backgroundColor: "#eef2ff",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  consentTitle: {
    fontFamily: "barlow-medium",
    fontSize: 16,
    color: "#111827",
  },
  consentDescription: {
    fontFamily: "barlow-regular",
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  consentButton: {
    backgroundColor: "#4630EB",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  consentButtonText: {
    color: "white",
    fontFamily: "barlow-medium",
    fontSize: 15,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "white",
  },
  emptyStateTitle: {
    fontFamily: "barlow-medium",
    fontSize: 20,
    color: "#0A2240",
    textAlign: "center",
    marginBottom: 10,
  },
  emptyStateDescription: {
    fontFamily: "barlow-regular",
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
});
