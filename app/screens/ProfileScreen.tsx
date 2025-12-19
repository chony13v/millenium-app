import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView , useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "@clerk/clerk-expo";
import { useProfileImage } from "@/hooks/profile/useProfileImage";

export default function ProfileScreen() {
  const { user } = useUser();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { handleChangeImage } = useProfileImage({
    userId: user?.id,
    onProfileUpdated: () => {},
  });
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: 24 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#1e3a8a", "#1e3a8a"]}
          start={[0, 0]}
          end={[1, 1]}
          style={[styles.heroCard, { paddingTop: insets.top + 6 }]}
        >
          <View style={styles.heroRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
          <Text style={styles.heroTitle}>Mi perfil</Text>
        </View>
        <Text style={styles.heroSubtitle}>
            Visualiza tu registro para participar en el Torneo.
        </Text>
      </LinearGradient>
        <View style={styles.card}>
          <TouchableOpacity onPress={handleChangeImage} activeOpacity={0.9}>
            <Image source={{ uri: user?.imageUrl }} style={styles.avatar} />
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.fullName}</Text>
          <Text style={styles.userEmail}>
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    paddingTop: 14,
    gap: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  heroCard: {
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 6,
    minHeight: 170,
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    color: "white",
    fontFamily: "barlow-semibold",
    fontSize: 18,
    marginLeft: 10,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: "barlow-regular",
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#f5f5f5",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  registrationText: {
    fontSize: 14,
    color: "#475569",
    marginTop: 6,
    textAlign: "center",
    fontFamily: "barlow-regular",
    lineHeight: 20,
  },
  userName: {
    fontSize: 18,
    fontFamily: "barlow-semibold",
    color: "#0A2240",
    marginTop: 8,
    textAlign: "left",
  },
  userEmail: {
    fontSize: 13,
    fontFamily: "barlow-regular",
    color: "#64748b",
    marginTop: 1,
    textAlign: "left",
  },
  emptyContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: "#0A2240",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowColor: "#0A2240",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  secondaryButtonText: {
    color: "white",
    fontFamily: "barlow-semibold",
    fontSize: 14,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
