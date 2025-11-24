import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Dimensions,
  Alert,
  
} from "react-native";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useFocusEffect } from "@react-navigation/native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import LoadingBall from "@/components/LoadingBall";
import { useCitySelection } from "@/hooks/useCitySelection";
import type { CityId } from "@/constants/cities";
import { useUser } from "@clerk/clerk-expo";
import { updateUserLocationBucket } from "@/services/location/updateUserLocationBucket";

interface FieldItem {
  id: string;
  imageUrl: string;
  title: string;
  latitude?: number;
  longitude?: number;
  locationUrl?: string;
  cityId?: CityId;
}

const handleLocationPress = (
  locationUrl?: string,
  latitude?: number,
  longitude?: number
) => {
  if (locationUrl) {
    Linking.openURL(locationUrl);
  } else if (latitude && longitude) {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  }
};
const screenWidth = Dimensions.get("window").width;

export default function Field() {
  const [fieldList, setFieldList] = useState<FieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [distances, setDistances] = useState<{ [key: string]: number }>({});
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({});
  const imageLoadTimeouts = useRef<{
    [key: string]: ReturnType<typeof setTimeout>;
  }>({});

  useEffect(() => {
    return () => {
      Object.values(imageLoadTimeouts.current).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
    };
  }, []);
  const { selectedCity, hasHydrated } = useCitySelection();
  const { user } = useUser();
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const lastPromptTimeRef = useRef<number | null>(null);

  useEffect(() => {
    setDistances({});
  }, [selectedCity]);

  useEffect(() => {
    setDistances({});
  }, [selectedCity]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!selectedCity) {
      setFieldList([]);
      setLoading(false);
      return;
    }

    let isActive = true;

    const fetchFields = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "Field"),
          // Los documentos "Field" deben incluir un campo "cityId" con uno de los
          // identificadores definidos en constants/cities.ts. Aquí filtramos por la
          // ciudad seleccionada para mostrar únicamente sus canchas.
          where("cityId", "==", selectedCity)
        );
        const querySnapshot = await getDocs(q);
        const items: FieldItem[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ ...doc.data(), id: doc.id } as FieldItem);
        });

        if (isActive) {
          setFieldList(items);
        }
      } catch (error) {
        console.error("Error fetching field data:", error);
        if (isActive) {
          setFieldList([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchFields();

    return () => {
      isActive = false;
    };
  }, [selectedCity, hasHydrated]);

  const getUserLocation = useCallback(async () => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          "Servicios de ubicación desactivados",
          "Activa los servicios de ubicación para ver la distancia a los centros deportivos."
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permiso de ubicación denegado",
          "No podemos calcular las distancias sin acceso a tu ubicación. Habilítala en la configuración de tu dispositivo."
        );

        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation(location.coords);
      } catch (locationError) {
        console.warn(
          "Fallo al obtener la ubicación actual, intentando la última ubicación conocida.",
          locationError
        );
        const lastKnownLocation = await Location.getLastKnownPositionAsync();
        if (lastKnownLocation) {
          setUserLocation(lastKnownLocation.coords);
          Alert.alert(
            "Usando tu última ubicación conocida",
            "No pudimos obtener tu ubicación actual, mostrando distancias aproximadas."
          );
        } else {
          Alert.alert(
            "No se pudo obtener tu ubicación",
            "Verifica que los servicios de ubicación estén activos y vuelve a intentarlo."
          );
        }
      }
    } catch (error) {
      console.error("Error al preparar la ubicación del usuario:", error);
      Alert.alert(
        "Error de ubicación",
        "Ocurrió un problema al obtener tu ubicación. Inténtalo nuevamente más tarde."
      );
    }
  }, []);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const lastPrompt = lastPromptTimeRef.current;

      if (!lastPrompt || now - lastPrompt > 5 * 60 * 1000) {
        lastPromptTimeRef.current = now;
        void getUserLocation();
      }
    }, [getUserLocation])
  );

  const calculateDistances = useCallback(
    (fields: FieldItem[]) => {
      if (!userLocation) return;

      const newDistances: { [key: string]: number } = {};
      fields.forEach((field) => {
        if (field.latitude && field.longitude) {
          const distance = getDistance(
            {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            },
            { latitude: field.latitude, longitude: field.longitude }
          );
          newDistances[field.id] = distance;
        }
      });
      setDistances(newDistances);
    },
    [userLocation]
  );

  useEffect(() => {
    if (userLocation && fieldList.length > 0) {
      calculateDistances(fieldList);
    }
  }, [userLocation, fieldList, calculateDistances]);

  // Memoize the sorted list to prevent unnecessary re-sorting
  const sortedFieldList = useMemo(() => {
    if (!distances || fieldList.length === 0) return fieldList;
    return [...fieldList].sort((a, b) => {
      const distanceA = distances[a.id] || Infinity;
      const distanceB = distances[b.id] || Infinity;
      return distanceA - distanceB;
    });
  }, [fieldList, distances]);

  const renderItem = ({ item }: { item: FieldItem }) => (
    <View style={styles.itemContainer}>
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: item.imageUrl,
            cache: "force-cache",
            headers: {
              Pragma: "no-cache",
            },
          }}
          style={styles.image}
          resizeMode="cover"
          onLoadStart={() => {
            setImageLoading((prev) => ({ ...prev, [item.id]: true }));
            if (imageLoadTimeouts.current[item.id]) {
              clearTimeout(imageLoadTimeouts.current[item.id]);
            }
            imageLoadTimeouts.current[item.id] = setTimeout(() => {
              setImageError((prev) => ({ ...prev, [item.id]: true }));
              setImageLoading((prev) => ({ ...prev, [item.id]: false }));
              console.warn(
                "Tiempo de carga excedido para la imagen:",
                item.imageUrl
              );
            }, 10000);
          }}
          onLoadEnd={() => {
            if (imageLoadTimeouts.current[item.id]) {
              clearTimeout(imageLoadTimeouts.current[item.id]);
              delete imageLoadTimeouts.current[item.id];
            }
            setImageLoading((prev) => ({ ...prev, [item.id]: false }));
          }}
          onError={() => {
            if (imageLoadTimeouts.current[item.id]) {
              clearTimeout(imageLoadTimeouts.current[item.id]);
              delete imageLoadTimeouts.current[item.id];
            }
            setImageError((prev) => ({ ...prev, [item.id]: true }));
            setImageLoading((prev) => ({ ...prev, [item.id]: false }));
            console.warn("Error loading image:", item.imageUrl);
          }}
          defaultSource={require("@/assets/images/placeholder.png")} // Add a default placeholder image
        />
        {imageLoading[item.id] && (
          <View style={styles.imageLoaderContainer}>
            <LoadingBall text="Cargando imagen..." />
          </View>
        )}
        {imageError[item.id] && (
          <View style={styles.errorContainer}>
            <FontAwesome name="image" size={40} color="#666" />
            <Text style={styles.errorText}>No se pudo cargar la imagen</Text>
          </View>
        )}
      </View>
      <View style={styles.textContainer}>
        <TouchableOpacity
          style={styles.titleContainer}
          onPress={() =>
            handleLocationPress(item.locationUrl, item.latitude, item.longitude)
          }
        >
          <Text style={styles.headerTitle}>{item.title}</Text>
          <MaterialIcons name="location-on" size={20} color="#4630EB" />
        </TouchableOpacity>
        {distances[item.id] !== undefined && (
          <Text style={styles.distanceText}>
            {(distances[item.id] / 1000).toFixed(2)} km de distancia
          </Text>
        )}
      </View>
    </View>
  );

  const memoizedRenderItem = useCallback(renderItem, [
    distances,
    imageLoading,
    imageError,
  ]);

  const handleUpdateLocationBucket = useCallback(async () => {
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
  }, [selectedCity, user?.id]);

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

  if (fieldList.length === 0) {
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
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          <View style={styles.consentCard}>
            <Text style={styles.consentTitle}>
              Permite ver canchas cercanas
            </Text>
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
      }
      data={sortedFieldList}
      keyExtractor={(item) => item.id}
      renderItem={memoizedRenderItem}
      style={[styles.list, { backgroundColor: "white" }]}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      scrollEnabled={true}
      removeClippedSubviews={true}
      maxToRenderPerBatch={3}
      initialNumToRender={3}
      windowSize={3}
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
  loader: {
    marginTop: 20,
  },
  list: {
    paddingHorizontal: 10,
  },
  itemContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textContainer: {
    alignItems: "flex-start",
    width: "100%",
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontFamily: "barlow-medium",
    fontSize: 16,
    marginBottom: 5,
    color: "#0A2240",
  },
  distanceText: {
    fontFamily: "barlow-regular",
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  imageContainer: {
    width: screenWidth * 0.9,
    height: screenWidth * 0.9 * (9 / 16),
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageLoaderContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  errorContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    color: "#666",
    marginTop: 10,
    fontFamily: "barlow-regular",
    fontSize: 14,
    textAlign: "center",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  soccerBall: {
    marginBottom: 20,
  },
  loadingText: {
    fontFamily: "barlow-medium",
    fontSize: 16,
    color: "#0A2240",
  },
});
