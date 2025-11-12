import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getDistance } from "geolib";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import type { LocationObjectCoords } from "expo-location";

import LoadingBall from "@/components/LoadingBall";
import useForegroundLocation from "@/src/hooks/useForegroundLocation";
import { loadNearbyFields } from "@/src/services/firestore/nearbyContent";

const screenWidth = Dimensions.get("window").width;
const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

type FieldFirestore = {
  imageUrl?: string;
  title?: string;
  latitude?: number;
  longitude?: number;
  locationUrl?: string;
  city?: string;
  citySlug?: string | null;
  latBucket?: number | null;
  lonBucket?: number | null;
};

interface FieldItem {
  id: string;
  imageUrl: string;
  title: string;
  latitude?: number;
  longitude?: number;
  locationUrl?: string;
}

const handleLocationPress = (
  locationUrl?: string,
  latitude?: number,
  longitude?: number
) => {
  if (locationUrl) {
    Linking.openURL(locationUrl).catch((error) =>
      console.warn("No se pudo abrir la ubicación", error)
    );
    return;
  }

  if (latitude && longitude) {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch((error) =>
      console.warn("No se pudo abrir Google Maps", error)
    );
  }
};

const mapFieldRecord = (
  record: FieldFirestore & { id: string }
): FieldItem => ({
  id: record.id,
  imageUrl: typeof record.imageUrl === "string" ? record.imageUrl : "",
  title: typeof record.title === "string" ? record.title : "Centro deportivo",
  latitude: typeof record.latitude === "number" ? record.latitude : undefined,
  longitude:
    typeof record.longitude === "number" ? record.longitude : undefined,
  locationUrl:
    typeof record.locationUrl === "string" ? record.locationUrl : undefined,
});

export default function Field() {
  const { ensureFreshLocation } = useForegroundLocation();
  const [fieldList, setFieldList] = useState<FieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [distances, setDistances] = useState<{ [key: string]: number }>({});
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({});

  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<LocationObjectCoords | null>(
    null
  );

  const calculateDistances = useCallback(
    (fields: FieldItem[], coords: LocationObjectCoords) => {
      const newDistances: { [key: string]: number } = {};

      fields.forEach((field) => {
        if (field.latitude && field.longitude) {
          const distance = getDistance(
            {
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
            {
              latitude: field.latitude,
              longitude: field.longitude,
            }
          );

          newDistances[field.id] = distance / 1000; // convert to km
        }
      });

      setDistances(newDistances);
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refreshFields = async () => {
        setLoading(true);
        setWarningMessage(null);

        try {
          const result = await ensureFreshLocation({
            maxAgeMs: SIX_HOURS_IN_MS,
          });

          if (!isActive) {
            return;
          }

          if (result.status === "success" && result.location) {
            setUserCoords(result.location.coords);
            const records = await loadNearbyFields<FieldFirestore>({
              latBucket: result.location.latBucket ?? undefined,
              lonBucket: result.location.lonBucket ?? undefined,
              citySlug: result.location.citySlug ?? undefined,
            });

            if (!isActive) {
              return;
            }

            const items = records.map((record) =>
              mapFieldRecord({ id: record.id, ...record.data })
            );

            setFieldList(items);
            if (items.length > 0) {
              calculateDistances(items, result.location.coords);
            } else {
              setDistances({});
            }
          } else {
            setFieldList([]);
            setUserCoords(null);

            if (result.status === "permission-denied") {
              setWarningMessage(
                "Activa los permisos de ubicación desde la configuración para ver canchas cercanas."
              );
            } else if (result.status === "services-disabled") {
              setWarningMessage(
                "Activa los servicios de ubicación de tu dispositivo para mostrar canchas cercanas."
              );
            } else if (result.status === "opted-out") {
              setWarningMessage(
                "Activa el contenido por barrio desde la configuración para recibir recomendaciones cercanas."
              );
            }
          }
        } catch (error) {
          console.error("Error fetching nearby fields:", error);
          if (isActive) {
            setFieldList([]);
            setUserCoords(null);
            setWarningMessage(
              "No pudimos cargar las canchas cercanas. Inténtalo nuevamente más tarde."
            );
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      refreshFields();

      return () => {
        isActive = false;
      };
    }, [calculateDistances, ensureFreshLocation])
  );

  useEffect(() => {
    if (userCoords) {
      calculateDistances(fieldList, userCoords);
    }
  }, [calculateDistances, fieldList, userCoords]);

  const renderItem = useCallback(
    ({ item }: { item: FieldItem }) => {
      const distance = distances[item.id];
      const hasImageError = imageError[item.id];
      const isImageLoading = imageLoading[item.id];

      return (
        <View style={styles.cardContainer}>
          <View style={styles.cardContent}>
            <View style={styles.imageContainer}>
              {isImageLoading && !hasImageError && (
                <ActivityIndicator size="small" color="#F02B44" />
              )}
              {hasImageError ? (
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons
                    name="image-not-supported"
                    size={48}
                    color="#CBD5F5"
                  />
                </View>
              ) : (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.image}
                  onLoadStart={() =>
                    setImageLoading((prev) => ({ ...prev, [item.id]: true }))
                  }
                  onLoad={() =>
                    setImageLoading((prev) => ({ ...prev, [item.id]: false }))
                  }
                  onError={() => {
                    setImageLoading((prev) => ({ ...prev, [item.id]: false }));
                    setImageError((prev) => ({ ...prev, [item.id]: true }));
                  }}
                />
              )}
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.title}>{item.title}</Text>
              {distance ? (
                <View style={styles.distanceContainer}>
                  <MaterialIcons name="place" size={18} color="#F02B44" />
                  <Text style={styles.distanceText}>
                    {distance.toFixed(1)} km de distancia
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() =>
                  handleLocationPress(
                    item.locationUrl,
                    item.latitude,
                    item.longitude
                  )
                }
              >
                <FontAwesome name="map-marker" size={16} color="#FFFFFF" />
                <Text style={styles.locationButtonText}>Ver ubicación</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [distances, imageError, imageLoading]
  );

  const keyExtractor = useCallback((item: FieldItem) => item.id, []);

  const headerComponent = useMemo(() => {
    if (!warningMessage) {
      return null;
    }

    return (
      <View style={styles.warningBanner}>
        <Text style={styles.warningText}>{warningMessage}</Text>
      </View>
    );
  }, [warningMessage]);

  if (loading) {
    return <LoadingBall text="Buscando canchas cercanas..." />;
  }

  if (fieldList.length === 0) {
    return (
      <View style={styles.container}>
        {headerComponent}
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateTitle}>Sin canchas cercanas</Text>
          <Text style={styles.emptyStateDescription}>
            {warningMessage
              ? warningMessage
              : "Aún no encontramos canchas en tu zona. Prueba más tarde."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={fieldList}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={headerComponent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
  },

  listContent: {
    paddingBottom: 24,
  },

  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#F5F6FA",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },

  cardContent: {
    flexDirection: screenWidth > 400 ? "row" : "column",
  },
  imageContainer: {
    width: screenWidth > 400 ? screenWidth * 0.4 : "100%",
    height: 180,
    backgroundColor: "#CBD5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  infoContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
    justifyContent: "center",
  },
  title: {
    fontFamily: "barlow-bold",
    fontSize: 18,
    color: "#0F172A",
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",

    gap: 8,
  },

  distanceText: {
    fontFamily: "barlow-regular",
    fontSize: 14,

    color: "#475569",
  },

  locationButton: {
    flexDirection: "row",
    alignItems: "center",

    gap: 8,
    backgroundColor: "#F02B44",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignSelf: "flex-start",
  },

  locationButtonText: {
    fontFamily: "barlow-medium",

    fontSize: 14,
    color: "#FFFFFF",
  },
  emptyStateContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#F5F6FA",
  },
  emptyStateTitle: {
    fontFamily: "barlow-bold",
    fontSize: 18,
    color: "#0F172A",
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontFamily: "barlow-regular",

    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },

  warningBanner: {
    backgroundColor: "#FFF4E6",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  warningText: {
    fontFamily: "barlow-regular",
    fontSize: 13,
    color: "#C2410C",
  },
});
