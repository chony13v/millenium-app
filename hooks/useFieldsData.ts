import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { Alert } from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getDistance } from "geolib";
import { db } from "@/config/FirebaseConfig";
import { prefetchFieldImage } from "@/utils/fieldLocation";
import type { CityId } from "@/constants/cities";

const normalizeStorageUrl = (url?: string) => {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    // Nueva compatibilidad de Firebase Storage (firebasestorage.app) → host clásico
    if (parsed.hostname.includes("firebasestorage.app")) {
      parsed.hostname = parsed.hostname.replace("firebasestorage.app", "appspot.com");
    }

    // Asegura que el path del objeto esté correctamente codificado para evitar timeouts
    if (parsed.pathname.includes("/o/")) {
      const [before, objectPath] = parsed.pathname.split("/o/");
      if (objectPath) {
        parsed.pathname = `${before}/o/${encodeURIComponent(
          decodeURIComponent(objectPath)
        )}`;
      }
    }

    return parsed.toString();
  } catch {
    return url;
  }
};


type PrefetchStatus = Record<string, "pending" | "loaded" | "failed">;

export interface FieldItem {
  id: string;
  imageUrl: string;
  title: string;
  latitude?: number;
  longitude?: number;
  locationUrl?: string;
  cityId?: CityId;
}

interface UseFieldsDataResult {
  fieldList: FieldItem[];
  sortedFieldList: FieldItem[];
  loading: boolean;
  distances: { [key: string]: number };
  imageLoading: { [key: string]: boolean };
  imageError: { [key: string]: boolean };
  prefetchStatus: PrefetchStatus;
  handleImageLoadStart: (
    fieldId: string,
    imageUrl: string,
    hasPrefetchedImage: boolean
  ) => void;
  handleImageLoadEnd: (fieldId: string) => void;
  handleImageError: (fieldId: string) => void;
  setUserLocation: React.Dispatch<
    React.SetStateAction<Location.LocationObjectCoords | null>
  >;
  requestLocation: () => Promise<void>;
}

export const useFieldsData = (
  selectedCity: CityId | null,
  hasHydrated: boolean
): UseFieldsDataResult => {
  const [fieldList, setFieldList] = useState<FieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [distances, setDistances] = useState<{ [key: string]: number }>({});
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({});
  const [prefetchStatus, setPrefetchStatus] = useState<PrefetchStatus>({});
  const imageLoadTimeouts = useRef<{
    [key: string]: ReturnType<typeof setTimeout>;
  }>({});
  const lastPromptTimeRef = useRef<number | null>(null);

  const requestLocation = useCallback(async () => {
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
    return () => {
      Object.values(imageLoadTimeouts.current).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  useEffect(() => {
    setDistances({});
  }, [selectedCity]);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const lastPrompt = lastPromptTimeRef.current;

      if (!lastPrompt || now - lastPrompt > 5 * 60 * 1000) {
        lastPromptTimeRef.current = now;
        void requestLocation();
      }
    }, [requestLocation])
  );

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
          where("cityId", "==", selectedCity)
        );
        const querySnapshot = await getDocs(q);
        const items: FieldItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            ...data,
            id: doc.id,
            imageUrl: normalizeStorageUrl((data as FieldItem).imageUrl),
          } as FieldItem);
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

  useEffect(() => {
    if (fieldList.length === 0) {
      return;
    }

    let isMounted = true;
    const prefetchTimeouts: ReturnType<typeof setTimeout>[] = [];

    const isMountedCheck = () => isMounted;

    const warmUpImages = async () => {
      await Promise.all(
        fieldList.map((field) =>
          prefetchFieldImage(field, {
            onPending: (fieldId) => {
              setImageError((prev) => ({ ...prev, [fieldId]: false }));
              setPrefetchStatus((prev) => ({ ...prev, [fieldId]: "pending" }));
            },
            onLoaded: (fieldId) => {
              setPrefetchStatus((prev) => ({ ...prev, [fieldId]: "loaded" }));
            },
            onFailed: (fieldId) => {
              setPrefetchStatus((prev) => ({ ...prev, [fieldId]: "failed" }));
              setImageError((prev) => ({ ...prev, [fieldId]: true }));
            },
            registerTimeout: (timeoutId) => prefetchTimeouts.push(timeoutId),
            isMounted: isMountedCheck,
          })
        )
      );
    };

    void warmUpImages();

    return () => {
      isMounted = false;
      prefetchTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, [fieldList]);

  const sortedFieldList = useMemo(() => {
    if (!distances || fieldList.length === 0) return fieldList;
    return [...fieldList].sort((a, b) => {
      const distanceA = distances[a.id] || Infinity;
      const distanceB = distances[b.id] || Infinity;
      return distanceA - distanceB;
    });
  }, [fieldList, distances]);

  const handleImageLoadStart = useCallback(
    (fieldId: string, imageUrl: string, hasPrefetchedImage: boolean) => {
      if (hasPrefetchedImage) {
        setImageLoading((prev) => ({ ...prev, [fieldId]: false }));
        return;
      }

      setImageLoading((prev) => ({ ...prev, [fieldId]: true }));
      if (imageLoadTimeouts.current[fieldId]) {
        clearTimeout(imageLoadTimeouts.current[fieldId]);
      }
      imageLoadTimeouts.current[fieldId] = setTimeout(() => {
        setImageError((prev) => ({ ...prev, [fieldId]: true }));
        setImageLoading((prev) => ({ ...prev, [fieldId]: false }));
        console.warn("Tiempo de carga excedido para la imagen:", imageUrl);
      }, 30000);
    },
    []
  );

  const handleImageLoadEnd = useCallback((fieldId: string) => {
    if (imageLoadTimeouts.current[fieldId]) {
      clearTimeout(imageLoadTimeouts.current[fieldId]);
      delete imageLoadTimeouts.current[fieldId];
    }
    setImageLoading((prev) => ({ ...prev, [fieldId]: false }));
  }, []);

  const handleImageError = useCallback((fieldId: string) => {
    if (imageLoadTimeouts.current[fieldId]) {
      clearTimeout(imageLoadTimeouts.current[fieldId]);
      delete imageLoadTimeouts.current[fieldId];
    }
    setImageError((prev) => ({ ...prev, [fieldId]: true }));
    setImageLoading((prev) => ({ ...prev, [fieldId]: false }));
  }, []);

  useEffect(() => {
    void requestLocation();
  }, [requestLocation]);

  return {
    fieldList,
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
  };
};
