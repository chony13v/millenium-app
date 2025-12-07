import { useCallback, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { processReportPhoto } from "@/services/report/processReportPhoto";

export const useEventPhoto = () => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const pickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a tus fotos para adjuntar una imagen."
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return null;

    return processReportPhoto(result.assets[0].uri);
  }, []);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permiso de cámara",
        "Autoriza la cámara para tomar una foto."
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return null;

    return processReportPhoto(result.assets[0].uri);
  }, []);

  const pickPhoto = useCallback(() => {
    Alert.alert("Adjuntar foto", "Elige cómo agregar la imagen", [
      { text: "Cámara", onPress: () => void takePhoto().then(setPhotoUri) },
      {
        text: "Galería",
        onPress: () => void pickFromLibrary().then(setPhotoUri),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }, [pickFromLibrary, takePhoto]);

  const resetPhoto = useCallback(() => setPhotoUri(null), []);

  return {
    pickFromLibrary,
    pickPhoto,
    photoUri,
    resetPhoto,
    setPhotoUri,
    takePhoto,
  };
};
