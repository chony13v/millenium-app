import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
  Alert,
} from "react-native";
import { db } from "@/config/FirebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import LoadingBall from "@/components/LoadingBall";
import { useCitySelection } from "@/hooks/useCitySelection";
import type { CityId } from "@/constants/cities";
import { awardNewsClick } from "@/services/news/awardNewsClick";

interface NewsItem {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  date: string;
  tag: string;
  url: string;
  cityId?: CityId;
}

const NewsCard = React.memo(
  ({
    item,
    onPress,
    disabled,
  }: {
    item: NewsItem;
    onPress: (item: NewsItem) => void;
    disabled: boolean;
  }) => {
    const [imageLoading, setImageLoading] = useState(true);

    return (
      <TouchableOpacity
        onPress={() => onPress(item)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.card}>
          <View style={styles.imageContainer}>
            {imageLoading && (
              <ActivityIndicator
                size="small"
                color="#0ea5e9"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: [{ translateX: -10 }, { translateY: -10 }],
                }}
              />
            )}
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.tag}>{item.tag}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description} numberOfLines={3}>
              {item.description}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

NewsCard.displayName = "NewsCard";

export default function News() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { selectedCity, hasHydrated } = useCitySelection();

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!selectedCity) {
      setNewsItems([]);
      setLoading(false);
      return;
    }

    let isActive = true;

    const fetchNews = async () => {
      setLoading(true);

      try {
        const newsQuery = query(
          collection(db, "News"),
          where("cityId", "==", selectedCity)
        );
        const snapshot = await getDocs(newsQuery);

        const items: NewsItem[] = [];

        for (const doc of snapshot.docs) {
          const data = doc.data();
          items.push({
            ...data,
            id: doc.id,
            imageUrl: data.imageUrl,
          } as NewsItem);
        }
        // Sort items by date in descending order (newest first)
        const sortedItems = items.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        if (isActive) {
          setNewsItems(sortedItems);
        }
      } catch (error) {
        console.error("Error fetching News:", error);

        if (isActive) {
          setNewsItems([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchNews();

    return () => {
      isActive = false;
    };
  }, [selectedCity, hasHydrated]);

  const handlePressNews = async (item: NewsItem) => {
    if (!item.url) return;

    setProcessingId(item.id);
    try {
      console.log("[news] calling awardNewsClick", { newsId: item.id });
      const result = await awardNewsClick(item.id);
      if (result?.success) {
        if (!result.alreadyAwarded) {
          Alert.alert(
            "¡Puntos ganados!",
            `Ganaste ${result.points ?? 5} puntos por leer esta noticia.`
          );
        }
      } else {
        Alert.alert("No pudimos registrar tu visita", "Intenta nuevamente.");
      }
    } catch (error) {
      console.error("[news] award failed", error);
      Alert.alert("No pudimos registrar tu visita", "Intenta nuevamente.");
    } finally {
      setProcessingId(null);
      try {
        const supported = await Linking.canOpenURL(item.url);
        if (supported) {
          await Linking.openURL(item.url);
        } else {
          Alert.alert(
            "No se pudo abrir",
            "No pudimos abrir la noticia en este dispositivo."
          );
        }
      } catch (openError) {
        console.warn("[news] open url failed", openError);
        Alert.alert(
          "No se pudo abrir",
          "Verifica tu conexión o intenta nuevamente."
        );
      }
    }
  };

  if (!hasHydrated) {
    return <LoadingBall text="Cargando ciudades..." />;
  }

  if (!selectedCity) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateTitle}>Selecciona una ciudad</Text>
        <Text style={styles.emptyStateDescription}>
          Elige una ciudad desde la pantalla anterior para ver las noticias
          disponibles.
        </Text>
      </View>
    );
  }

  if (loading) {
    return <LoadingBall text="Cargando noticias..." />;
  }

  if (newsItems.length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateTitle}>No hay noticias disponibles</Text>
        <Text style={styles.emptyStateDescription}>
          Aún no tenemos novedades publicadas para esta ciudad. Vuelve más
          tarde.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <FlatList
        data={newsItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <NewsCard
            item={item}
            onPress={handlePressNews}
            disabled={processingId === item.id}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontFamily: "barlow-regular",
    fontSize: 16,
    color: "#0A2240",
    paddingHorizontal: 4,
    paddingTop: 2,
    paddingBottom: 8,
  },
  listContainer: {
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 4,
  },
  emptyStateContainer: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 12,
  },
  emptyStateTitle: {
    fontFamily: "barlow-semibold",
    fontSize: 18,
    color: "#0A2240",
    textAlign: "center",
  },
  emptyStateDescription: {
    fontFamily: "barlow-regular",
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#0f172a",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  imageContainer: {
    width: 110,
    backgroundColor: "#0A2240",
  },
  image: {
    width: 110,
    height: 130,
    resizeMode: "cover",
  },
  contentContainer: {
    flex: 1,
    padding: 12,
    paddingTop: 6,
    paddingRight: 12,
    backgroundColor: "white",
    justifyContent: "flex-start",
    flexDirection: "column",
  },
  date: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "barlow-medium",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  tag: {
    fontSize: 12,
    color: "#0ea5e9",
    fontFamily: "barlow-medium",
    alignSelf: "flex-start",
    marginBottom: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(14,165,233,0.12)",
    borderRadius: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: "barlow-semibold",
    color: "#0f172a",
    marginBottom: 4,
    textAlign: "left",
  },
  description: {
    fontSize: 12,
    color: "#475569",
    fontFamily: "barlow-regular",
    textAlign: "left",
    lineHeight: 18,
  },
  separator: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 8,
  },
});
