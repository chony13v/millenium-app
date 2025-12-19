import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useRewardsCatalog } from "@/hooks/useRewardsCatalog";
import { useCitySelection } from "@/hooks/useCitySelection";
import { type Reward } from "@/types/rewards";

type RewardsCatalogScreenProps = {
  onBack?: () => void;
};

const RewardCard = ({
  reward,
  onPress,
}: {
  reward: Reward;
  onPress: (reward: Reward) => void;
}) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.9}
    onPress={() => onPress(reward)}
  >
    {reward.imageUrl ? (
      <View style={styles.cardImageBox}>
        <Image
          source={{ uri: reward.imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      </View>
    ) : null}
    <View style={styles.cardHeader}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.cardTitle}>{reward.title}</Text>
        <Text style={styles.cardMerchant}>
          {reward.merchantName || reward.merchantId}
        </Text>
      </View>
      <View style={styles.pointsPill}>
        <Text style={styles.pointsLabel}>{reward.cost} pts</Text>
      </View>
    </View>
    {reward.description ? (
      <Text style={styles.cardDescription}>{reward.description}</Text>
    ) : null}
    <View style={styles.cardFooter}>
      <Text style={styles.cardCity}>
        {reward.cityId ? `Ciudad: ${reward.cityId}` : "Disponible para todos"}
      </Text>
      <Text style={styles.linkText}>Ver detalle</Text>
    </View>
  </TouchableOpacity>
);

export default function RewardsCatalogScreen({
  onBack,
}: RewardsCatalogScreenProps = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedCity } = useCitySelection();
  const { rewards, loading, error, refresh } = useRewardsCatalog(selectedCity);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  const handleRewardPress = (reward: Reward) => {
    router.push({
      pathname: "/(call)/Metodology/rewards/[rewardId]",
      params: {
        rewardId: reward.id,
        title: reward.title,
        merchantName: reward.merchantName ?? reward.merchantId,
        merchantId: reward.merchantId,
        cost: String(reward.cost),
        description: reward.description ?? "",
        cityId: reward.cityId ?? "",
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.title}>Catálogo de recompensas</Text>
          <Text style={styles.subtitle}>
            Elige un beneficio para canjear tus puntos.
          </Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && !rewards.length ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.NAVY_BLUE} />
          <Text style={styles.loadingText}>Cargando catálogo...</Text>
        </View>
      ) : (
        <FlatList
          data={rewards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 12 },
          ]}
          renderItem={({ item }) => (
            <RewardCard reward={item} onPress={handleRewardPress} />
          )}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
          ListEmptyComponent={
            <Text style={styles.errorText}>
              No hay recompensas disponibles por ahora.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: "barlow-semibold",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "barlow-regular",
    color: "#475569",
  },
  cardImageBox: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 8,
    backgroundColor: "#e2e8f0",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "barlow-semibold",
    color: "#0f172a",
  },
  cardMerchant: {
    fontSize: 13,
    fontFamily: "barlow-regular",
    color: "#475569",
  },
  pointsPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(14,165,233,0.12)",
    borderRadius: 12,
  },
  pointsLabel: {
    fontSize: 13,
    fontFamily: "barlow-semibold",
    color: "#0ea5e9",
  },
  cardDescription: {
    fontSize: 13,
    fontFamily: "barlow-regular",
    color: "#334155",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  cardCity: {
    fontSize: 12,
    fontFamily: "barlow-medium",
    color: "#6b7280",
  },
  linkText: {
    fontSize: 12,
    fontFamily: "barlow-semibold",
    color: Colors.NAVY_BLUE,
  },
  errorText: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    color: "#b91c1c",
    fontFamily: "barlow-medium",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: "barlow-medium",
    color: "#334155",
  },
});
