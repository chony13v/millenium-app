import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import { processReportPhoto } from "@/services/report/processReportPhoto";
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
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

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

  const pickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a tus fotos para adjuntar una imagen."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const processed = await processReportPhoto(result.assets[0].uri);
      if (processed) {
        setPhotoUri(processed);
      }
    }
  }, []);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permiso de cámara",
        "Autoriza la cámara para tomar una foto."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const processed = await processReportPhoto(result.assets[0].uri);
      if (processed) {
        setPhotoUri(processed);
      }
    }
  }, []);

  const pickPhoto = useCallback(() => {
    Alert.alert("Adjuntar foto", "Elige cómo agregar la imagen", [
      { text: "Cámara", onPress: () => void takePhoto() },
      { text: "Galería", onPress: () => void pickFromLibrary() },
      { text: "Cancelar", style: "cancel" },
    ]);
  }, [pickFromLibrary, takePhoto]);

  const resetProof = useCallback(() => {
    setCoords(initialCoords ?? null);
    setPhotoUri(null);
  }, [initialCoords]);

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
