import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { updateImage } from "@/services/profile/profileScreenData";
import { Profile } from "@/services/profile/profileScreenData";

const MAX_BASE64_LENGTH = 1000000;

type UseProfileImageParams = {
  userId?: string;
  onProfileUpdated: (profile: Profile) => void;
};

export const useProfileImage = ({
  userId,
  onProfileUpdated,
}: UseProfileImageParams) => {
  const [isImageLoading, setIsImageLoading] = useState(false);

  const handleChangeImage = () => {
    Alert.alert(
      "Cambiar Imagen",
      "¿Deseas cambiar tu imagen de perfil?",
      [
        { text: "No", style: "cancel" },
        { text: "Sí", onPress: () => pickImage() },
      ],
      { cancelable: true }
    );
  };

  const pickImage = async () => {
    if (!userId) return;

    try {
      setIsImageLoading(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Necesitas permisos para acceder a la galería."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (result.canceled) {
        return;
      }

      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        {
          compress: 0.5,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      const base64 = `data:image/jpeg;base64,${manipResult.base64}`;

      if (base64.length > MAX_BASE64_LENGTH) {
        Alert.alert(
          "Error",
          "La imagen seleccionada es demasiado grande. Por favor, elige una imagen más pequeña."
        );
        return;
      }

      const updatedProfile = await updateImage(userId, base64);

      if (updatedProfile) {
        onProfileUpdated(updatedProfile);
        Alert.alert("Éxito", "Imagen de perfil actualizada correctamente.");
      }
    } catch (error) {
      console.error("Error en pickImage:", error);
      Alert.alert("Error", "Ocurrió un error al seleccionar la imagen.");
    } finally {
      setIsImageLoading(false);
    }
  };

  return { isImageLoading, handleChangeImage };
};