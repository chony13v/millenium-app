import React, { useCallback, useMemo, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { Timestamp } from "firebase/firestore";

import LoadingBall from "@/components/LoadingBall";
import useForegroundLocation from "@/src/hooks/useForegroundLocation";
import { loadNearbyNews } from "@/src/services/firestore/nearbyContent";

const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

interface NewsFirestore {
  [key: string]: unknown;
  imageUrl?: string;
  title?: string;
  description?: string;
  date?: string;
  tag?: string;
  url?: string;
  publishedAt?: unknown;
}

interface NewsItem {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  date: string;
  tag: string;
  url: string;

  publishedAtMs: number;
}

const toMillis = (value: unknown): number => {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (value instanceof Timestamp) {
    return value.toDate().getTime();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (
    value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    try {
      const date = (value as { toDate: () => Date }).toDate();
      return date.getTime();
    } catch (error) {
      console.warn("No se pudo convertir la fecha de la noticia", error);
    }
  }

  return 0;
};

const mapNewsRecord = (record: NewsFirestore & { id: string }): NewsItem => {
  const publishedAtMs = toMillis(record.publishedAt ?? record.date ?? null);
  const displayDate =
    typeof record.date === "string" && record.date.trim().length > 0
      ? record.date
      : publishedAtMs
      ? new Date(publishedAtMs).toLocaleDateString("es-ES")
      : "";

  return {
    id: record.id,
    imageUrl: typeof record.imageUrl === "string" ? record.imageUrl : "",
    title: typeof record.title === "string" ? record.title : "",
    description:
      typeof record.description === "string" ? record.description : "",
    date: displayDate,
    tag: typeof record.tag === "string" ? record.tag : "",
    url: typeof record.url === "string" ? record.url : "",
    publishedAtMs,
  };
};

const NewsCard = React.memo(({ item }: { item: NewsItem }) => {
  const [imageLoading, setImageLoading] = useState(Boolean(item.imageUrl));

  const handlePress = useCallback(() => {
    if (item.url) {
      Linking.openURL(item.url).catch((error) =>
        console.warn("No se pudo abrir la noticia", error)
      );
    }
  }, [item.url]);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {imageLoading && (
            <ActivityIndicator
              size="small"
              color="#F02B44"
              style={styles.imageLoader}
            />
          )}
          {!!item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
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
          {item.date ? <Text style={styles.date}>{item.date}</Text> : null}
          {item.tag ? <Text style={styles.tag}>{item.tag}</Text> : null}
          <Text style={styles.title}>{item.title || "Nueva noticia"}</Text>
          {item.description ? (
            <Text style={styles.description} numberOfLines={3}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function News() {
  const { ensureFreshLocation } = useForegroundLocation();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refreshNews = async () => {
        setLoading(true);
        setWarningMessage(null);

        try {
          const result = await ensureFreshLocation({
            maxAgeMs: SIX_HOURS_IN_MS,
          });

          if (!isActive) {
            return;
          }

          if (result.status === "success" && result.location) {
            const records = await loadNearbyNews<NewsFirestore>({
              citySlug: result.location.citySlug,
              neighborhoodSlug: result.location.neighborhoodSlug,
              latBucket: result.location.latBucket,
              lonBucket: result.location.lonBucket,
            });

            if (!isActive) {
              return;
            }

            const items = records
              .map((record) => mapNewsRecord({ id: record.id, ...record.data }))
              .filter((item) =>
                [item.title, item.description, item.imageUrl].some(Boolean)
              );

            items.sort((a, b) => b.publishedAtMs - a.publishedAtMs);
            setNewsItems(items);
          } else {
            setNewsItems([]);

            if (result.status === "permission-denied") {
              setWarningMessage(
                "Activa los permisos de ubicación desde la configuración para ver noticias cercanas."
              );
            } else if (result.status === "services-disabled") {
              setWarningMessage(
                "Activa los servicios de ubicación de tu dispositivo para personalizar las noticias."
              );
            } else if (result.status === "opted-out") {
              setWarningMessage(
                "Activa el contenido por barrio desde la configuración para recibir noticias locales."
              );
            } else if (result.status === "missing-user") {
              setWarningMessage(
                "Inicia sesión para ver noticias personalizadas por ubicación."
              );
            }
          }
        } catch (error) {
          console.error("Error fetching nearby news:", error);
          if (isActive) {
            setNewsItems([]);
            setWarningMessage(
              "No pudimos cargar noticias cercanas. Inténtalo nuevamente más tarde."
            );
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      refreshNews();

      return () => {
        isActive = false;
      };
    }, [ensureFreshLocation])
  );

  const banner = useMemo(() => {
    if (!warningMessage) {
      return null;
    }

    return (
      <View style={styles.permissionBanner}>
        <Text style={styles.permissionBannerText}>{warningMessage}</Text>
      </View>
    );
  }, [warningMessage]);

  if (loading) {
    return <LoadingBall text="Cargando noticias cercanas..." />;
  }

  if (newsItems.length === 0) {
    return (
      <View style={styles.mainContainer}>
        <Text style={styles.headerTitle}>NOTICIAS</Text>
        {banner}
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateTitle}>Sin noticias cercanas</Text>
          <Text style={styles.emptyStateDescription}>
            {!warningMessage
              ? "Aún no tenemos novedades en tu zona. Vuelve más tarde."
              : warningMessage}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <Text style={styles.headerTitle}>NOTICIAS</Text>
      {banner}
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
    paddingBottom: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#F5F6FA",
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 20,
    elevation: 2,
    shadowColor: "#000",

    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  imageContainer: {
    width: 120,
    height: 140,
    backgroundColor: "#DADFE6",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageLoader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    gap: 4,
  },
  date: {
    fontFamily: "barlow-regular",
    fontSize: 12,
    color: "#64748B",
  },
  tag: {
    fontFamily: "barlow-medium",
    fontSize: 12,
    color: "#F02B44",
  },
  title: {
    fontFamily: "barlow-bold",
    fontSize: 16,
    color: "#111827",
  },
  description: {
    fontFamily: "barlow-regular",
    fontSize: 13,
    color: "#1F2937",
  },
  separator: {
    height: 16,
  },
  emptyStateContainer: {
    marginHorizontal: 20,
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#F5F6FA",
  },
  emptyStateTitle: {
    fontFamily: "barlow-bold",
    fontSize: 16,
    color: "#111827",
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontFamily: "barlow-regular",
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  permissionBanner: {
    backgroundColor: "#FDECEA",
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  permissionBannerText: {
    fontFamily: "barlow-regular",
    fontSize: 12,
    color: "#B3261E",
  },
});
