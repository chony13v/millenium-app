import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import { useEventPhoto } from "./useEventPhoto";
import type { AttendanceCoords } from "@/services/events/types";

type UseEventAttendanceFormParams = {
  initialCoords?: AttendanceCoords | null;
};

export const useEventAttendanceForm = ({
  initialCoords = null,
}: UseEventAttendanceFormParams = {}) => {
  const [coords, setCoords] = useState<AttendanceCoords | null>(
    initialCoords ?? null
  );

  const [locationLoading, setLocationLoading] = useState(false);
  const { photoUri, pickPhoto, resetPhoto, setPhotoUri } = useEventPhoto();

  useEffect(() => {
    setCoords(initialCoords ?? null);
  }, [initialCoords]);

  const requestCoords = useCallback(async () => {
    setLocationLoading(true);
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          "Activa ubicación",
          "Habilita la ubicación para registrar asistencia."
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso de ubicación",
          "Necesitamos permiso de ubicación para adjuntar coordenadas."
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      console.error("Error obteniendo coordenadas", error);
      Alert.alert(
        "Ubicación no disponible",
        "No pudimos obtener tu ubicación. Intenta de nuevo."
      );
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const resetProof = useCallback(() => {
    setCoords(initialCoords ?? null);
    resetPhoto();
  }, [initialCoords, resetPhoto]);

  return {
    coords,
    locationLoading,
    photoUri,
    pickPhoto,
    requestCoords,
    resetProof,
    setCoords,
    setPhotoUri,
  };
};
