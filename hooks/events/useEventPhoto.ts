import { useCallback, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { processReportPhoto } from "@/services/report/processReportPhoto";

export const useEventPhoto = () => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handleAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset | undefined) => {
      if (!asset?.uri) return null;
      try {
        return await processReportPhoto(asset.uri);
      } catch (pickerError) {
        console.warn("No se pudo procesar la foto del evento", pickerError);
        Alert.alert(
          "No se pudo adjuntar",
          "Intenta nuevamente o elige otra imagen."
        );
        return null;
      }
    },
    []
  );

  const pickFromLibrary = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permiso requerido",
          "Necesitamos acceso a tus fotos para adjuntar una imagen."
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        selectionLimit: 1,
      });

      if (result.canceled) return null;

      return handleAsset(result.assets?.[0]);
    } catch (pickerError) {
      console.warn("No se pudo abrir la galería", pickerError);
      Alert.alert(
        "No se pudo abrir la galería",
        "Intenta nuevamente para adjuntar tu foto."
      );
      return null;
    }
  }, [handleAsset]);

  const takePhoto = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permiso de cámara",
          "Autoriza la cámara para tomar una foto."
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (result.canceled) return null;

      return handleAsset(result.assets?.[0]);
    } catch (pickerError) {
      console.warn("No se pudo abrir la cámara", pickerError);
      Alert.alert("No se pudo abrir la cámara", "Intenta tomar la foto otra vez.");
      return null;
    }
  }, [handleAsset]);

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
