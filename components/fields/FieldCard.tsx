import React, { memo } from "react";
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
const cardWidth = screenWidth - 32;

function FieldCard({
  item,
  distance,
  isImageLoading,
  isImageError,
  hasPrefetchedImage,
  onLoadStart,
  onLoadEnd,
  onError,
}: FieldCardProps) {
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
          <MaterialIcons name="location-on" size={20} color="#0ea5e9" />
        </TouchableOpacity>
        {distance !== undefined && (
          <View style={styles.metaRow}>
            <Text style={styles.distanceText}>
              {(distance / 1000).toFixed(2)} km cerca
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    marginBottom: 18,
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    width: "100%",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textContainer: {
    width: "100%",
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 6,
  },
  headerTitle: {
    fontFamily: "barlow-medium",
    fontSize: 17,
    color: "#0A2240",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  distanceText: {
    fontFamily: "barlow-regular",
    fontSize: 13,
    color: "#0ea5e9",
    backgroundColor: "rgba(14,165,233,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  imageContainer: {
    width: cardWidth,
    height: cardWidth * (9 / 16),
    overflow: "hidden",
    backgroundColor: "#0A2240",
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

export default memo(FieldCard);
