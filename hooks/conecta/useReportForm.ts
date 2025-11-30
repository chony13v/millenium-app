import { useCallback, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";

import { db } from "@/config/FirebaseConfig";
import type { CityId } from "@/constants/cities";
import type { ProblemType } from "@/types/reports";
import { awardPointsEvent } from "@/services/points/awardPoints";
import { processReportPhoto } from "@/services/report/processReportPhoto";
import { validateDescription } from "@/utils/reportValidation";

interface UseReportFormParams {
  selectedCity: CityId | null;
  storage: FirebaseStorage;
  userId?: string;
}

export const useReportForm = ({
  selectedCity,
  storage,
  userId,
}: UseReportFormParams) => {
  const [problemType, setProblemType] = useState<ProblemType | null>(null);
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const uploadPhotoIfNeeded = useCallback(async () => {
    if (!photoUri) return null;

    const response = await fetch(photoUri);
    const blob = await response.blob();

    const extension = photoUri.split(".").pop() ?? "jpg";
    const safeUser = userId ?? "anon";
    const storageRef = ref(
      storage,
      `reports/${safeUser}/${Date.now()}.${extension}`
    );

    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    return url;
  }, [photoUri, storage, userId]);

  const resetForm = useCallback(() => {
    setProblemType(null);
    setDescription("");
    setLocationText("");
    setCoords(null);
    setPhotoUri(null);
  }, []);

  const requestCoords = useCallback(async () => {
    setLocationLoading(true);
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          "Activa ubicación",
          "Habilita la ubicación para enviar el reporte con coordenadas."
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

  const handleSubmitReport = useCallback(async () => {
    if (!userId) {
      Alert.alert(
        "Inicia sesión",
        "Necesitas estar autenticado para reportar."
      );
      return;
    }

    if (!selectedCity) {
      Alert.alert(
        "Selecciona un proyecto",
        "Elige una ciudad para enviar el reporte."
      );
      return;
    }

    if (
      !problemType ||
      !description.trim() ||
      !locationText.trim() ||
      !validateDescription(description)
    ) {
      Alert.alert(
        "Completa los campos",
        "Por favor completa todos los campos y asegúrate de que tu mensaje sea claro y respetuoso."
      );
      return;
    }

    if (!coords) {
      Alert.alert(
        "Ubicación requerida",
        "Obtén tu ubicación antes de enviar para guardar las coordenadas."
      );
      return;
    }

    setSubmittingReport(true);

    try {
      const photoUrl = await uploadPhotoIfNeeded();

      const coordsPayload = coords
        ? { latitude: coords.latitude, longitude: coords.longitude }
        : null;

      await addDoc(collection(db, "cityReports"), {
        problemType,
        description: description.trim(),
        locationText: locationText.trim(),
        coords: coordsPayload,
        photoUrl: photoUrl ?? null,
        userId,
        cityId: selectedCity,
        status: "pendiente",
        createdAt: serverTimestamp(),
      });

      try {
        await awardPointsEvent({
          userId,
          eventType: "city_report_created",
          metadata: {
            problemType,
            cityId: selectedCity,
          },
        });
      } catch (pointsError) {
        console.warn(
          "No se pudieron otorgar puntos por reporte ciudadano:",
          pointsError
        );
      }

      resetForm();

      Alert.alert(
        "Reporte enviado",
        "Gracias por ayudarnos a mejorar la ciudad."
      );
    } catch (error) {
      console.error("Error enviando reporte", error);
      Alert.alert(
        "No pudimos enviar",
        "Intenta nuevamente, puede que no haya conexión."
      );
    } finally {
      setSubmittingReport(false);
    }
  }, [
    coords,
    description,
    locationText,
    problemType,
    resetForm,
    selectedCity,
    uploadPhotoIfNeeded,
    userId,
  ]);

  return {
    coords,
    description,
    handleSubmitReport,
    locationLoading,
    locationText,
    pickPhoto,
    problemType,
    requestCoords,
    resetForm,
    setDescription,
    setLocationText,
    setProblemType,
    setCoords,
    setPhotoUri,
    photoUri,
    submittingReport,
  };
};
