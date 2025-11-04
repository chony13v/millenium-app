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
} from "react-native";
import { db } from "@/config/FirebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import LoadingBall from "@/components/LoadingBall";
import { useCitySelection } from "@/hooks/useCitySelection";
import type { CityId } from "@/constants/cities";

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

const NewsCard = React.memo(({ item }: { item: NewsItem }) => {
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <TouchableOpacity
      onPress={() => (item.url ? Linking.openURL(item.url) : null)}
      activeOpacity={0.7}
    >
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {imageLoading && (
            <ActivityIndicator
              size="small"
              color="#F02B44"
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
});

export default function News() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
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
      <Text style={styles.headerTitle}>NOTICIAS</Text>
      <FlatList
        data={newsItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <>
            <NewsCard item={item} />
            <View style={styles.separator} />
          </>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  headerTitle: {
    fontFamily: "barlow-regular",
    fontSize: 20,
    color: "#000",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
  },
  listContainer: {
    padding: 20,
  },
  emptyStateContainer: {
    flex: 1,
    backgroundColor: "white",
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
    marginBottom: 10,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  imageContainer: {
    width: 120,
    backgroundColor: "#f5f5f5",
  },
  image: {
    width: 120,
    height: 140,
    resizeMode: "cover",
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 2,
    paddingRight: 24,
    backgroundColor: "white",
    justifyContent: "flex-start",
    flexDirection: "column",
  },
  date: {
    fontSize: 12,
    color: "#888",
    fontFamily: "barlow-light",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  tag: {
    fontSize: 12,
    color: "#F02B44",
    fontFamily: "barlow-medium",
    alignSelf: "flex-start",
    marginBottom: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(240,43,68,0.08)",
    borderRadius: 4,
  },
  title: {
    fontSize: 13,
    fontFamily: "barlow-semibold",
    color: "#0A2240",
    marginBottom: 2,
    textAlign: "justify",
  },
  description: {
    fontSize: 12,
    color: "#0A2240",
    fontFamily: "barlow-light",
    textAlign: "justify",
  },
  separator: {
    height: 2,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 20,
    marginBottom: 15,
  },
});
