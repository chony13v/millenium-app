import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { db } from "@/config/FirebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "expo-router";
import LoadingBall from "@/components/LoadingBall";
import { useFirebaseUid } from "@/hooks/useFirebaseUid";
import { logSocialMediaClick } from "@/services/analytics/socialMediaClicks";

interface CategoryItem {
  id: string;
  icon: string;
  name: string;
  link: string;
}

const CategoryCard = React.memo(
  ({
    item,
    onPress,
  }: {
    item: CategoryItem;
    onPress: (item: CategoryItem) => void;
  }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.iconWrapper}>
        <Image source={{ uri: item.icon }} style={styles.icon} />
      </View>
      <Text style={styles.name}>{item.name}</Text>
    </TouchableOpacity>
  )
);

export default function CategoryIcons() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { firebaseUid } = useFirebaseUid();

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const snapshot = await getDocs(collection(db, "Category"));
        const items: CategoryItem[] = [];
        snapshot.forEach((doc) => {
          items.push({ ...doc.data(), id: doc.id } as CategoryItem);
        });
        if (isMounted) {
          setCategories(items);
        }
      } catch (error) {
        console.error("Error fetching Category:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePress = useCallback(
    (item: CategoryItem) => {
      try {
        const { link } = item;
        if (!link || link.trim() === "") {
          Alert.alert(
            "Error",
            "El link no está disponible. Por favor, inténtelo de nuevo más tarde.",
            [{ text: "OK" }]
          );
          return;
        }
        logSocialMediaClick({
          channelId: item.id,
          url: link,
          userId: firebaseUid,
        });
        router.push(link as any);
      } catch (error) {
        console.error("Navigation error:", error);
        Alert.alert(
          "Error",
          "Ha ocurrido un error al intentar navegar. Por favor, inténtelo de nuevo más tarde.",
          [{ text: "OK" }]
        );
      }
    },
    [router, firebaseUid]
  );

  const renderItem = useCallback(
    ({ item }: { item: CategoryItem }) => (
      <CategoryCard item={item} onPress={() => handlePress(item)} />
    ),
    [handlePress]
  );

  const contentContainerStyle = useMemo(
    () => ({
      ...styles.listContent,
    }),
    []
  );

  if (loading) {
    return <LoadingBall text="Cargando categorías..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  listContent: {
    paddingVertical: 4,
    paddingLeft: 4,
  },
  item: {
    alignItems: "center",
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minWidth: 110,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  name: {
    marginTop: 5,
    fontSize: 13,
    fontFamily: "barlow-medium",
    color: "#0A2240",
    textAlign: "center",
  },
});
