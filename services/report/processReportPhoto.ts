import { Alert } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";

const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3 MB

export const processReportPhoto = async (uri: string) => {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
  );

  const resp = await fetch(manipulated.uri);
  const blob = await resp.blob();

  if (blob.size > MAX_PHOTO_BYTES) {
    Alert.alert(
      "Imagen muy pesada",
      "La foto supera los 3 MB. Reduce la resolución o toma otra."
    );
    return null;
  }

  return manipulated.uri;
};
