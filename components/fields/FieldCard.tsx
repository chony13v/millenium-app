import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import LoadingBall from "@/components/LoadingBall";
import { handleLocationPress } from "@/utils/fieldLocation";
import type { FieldItem } from "@/hooks/useFieldsData";

interface FieldCardProps {
  item: FieldItem;
  distance?: number;
  isImageLoading?: boolean;
  isImageError?: boolean;
  hasPrefetchedImage?: boolean;
  onLoadStart: (
    fieldId: string,
    imageUrl: string,
    hasPrefetchedImage: boolean
  ) => void;
  onLoadEnd: (fieldId: string) => void;
  onError: (fieldId: string) => void;
}

const screenWidth = Dimensions.get("window").width;

export const FieldCard: React.FC<FieldCardProps> = ({
  item,
  distance,
  isImageLoading,
  isImageError,
  hasPrefetchedImage,
  onLoadStart,
  onLoadEnd,
  onError,
}) => {
  return (
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
          onLoadStart={() =>
            onLoadStart(item.id, item.imageUrl, Boolean(hasPrefetchedImage))
          }
          onLoadEnd={() => onLoadEnd(item.id)}
          onError={() => onError(item.id)}
          defaultSource={require("@/assets/images/placeholder.png")}
        />
        {isImageLoading && (
          <View style={styles.imageLoaderContainer}>
            <LoadingBall text="Cargando imagen..." />
          </View>
        )}
        {isImageError && (
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
        {distance !== undefined && (
          <Text style={styles.distanceText}>
            {(distance / 1000).toFixed(2)} km de distancia
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default FieldCard;
