import React, { useEffect, useState } from "react";
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
import LoadingBall from '@/components/LoadingBall';

interface CategoryItem {
  id: string;
  icon: string;
  name: string;
  link: string;
}

export default function CategoryIcons() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getDocs(collection(db, "Category"));
        const items: CategoryItem[] = [];
        snapshot.forEach((doc) => {
          items.push({ ...doc.data(), id: doc.id } as CategoryItem);
        });
        setCategories(items);
      } catch (error) {
        console.error("Error fetching Category:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <LoadingBall text="Cargando categorías..." />;
  }

  const handlePress = (link: string) => {
    try {
      if (!link || link.trim() === '') {
        Alert.alert(
          "Error",
          "El link no está disponible. Por favor, inténtelo de nuevo más tarde.",
          [{ text: "OK" }]
        );
        return;
      }
      router.push(link as any);
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert(
        "Error",
        "Ha ocurrido un error al intentar navegar. Por favor, inténtelo de nuevo más tarde.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <View style={styles.container}>
        <Text style={{ fontFamily: 'barlow-light', fontSize: 16, marginHorizontal: 20, marginBottom: 20 }}>
        Síguenos en nuestros canales oficiales:</Text>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
                style={styles.item}
                onPress={() => handlePress(item.link)}
                activeOpacity={0.7} 
            >
              <Image source={{ uri: item.icon }} style={styles.icon} />
              <Text style={styles.name}>{item.name}</Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 20 }}
        />
      </View>
      <View style={styles.separator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  
    paddingBottom: 10,
  },
  separator: {
    borderBottomWidth: 2,
    borderBottomColor: '#F0F4FF',
    marginHorizontal: 20,
  },
  item: {
    alignItems: "center",
    marginRight: 15,

  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: "contain",

  },
  name: {
    marginTop: 5,
    fontSize: 14,
  },
});
