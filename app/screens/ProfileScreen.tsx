import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Button,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import LoadingBall from "@/components/LoadingBall";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileDetails from "@/components/profile/ProfileDetails";
import { fetchProfile, Profile } from "@/services/profile/profileScreenData";
import { useProfileImage } from "@/hooks/profile/useProfileImage";

export default function ProfileScreen() {
  const { user } = useUser();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { isImageLoading, handleChangeImage } = useProfileImage({
    userId: user?.id,
    onProfileUpdated: (updatedProfile) => setProfile(updatedProfile),
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const fetchedProfile = await fetchProfile(user.id);
        setProfile(fetchedProfile);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4630EB" />
          <LoadingBall text="Cargando perfil..." />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backgroundContainer}>
          <View style={styles.card}>
            <TouchableOpacity onPress={handleChangeImage}>
              <Image source={{ uri: user?.imageUrl }} style={styles.avatar} />
            </TouchableOpacity>
            <Text style={styles.userName}>{user?.fullName}</Text>
            <Text style={styles.userEmail}>
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
          </View>
          <View style={styles.outsideContainer}>
            <Text style={styles.registrationText}>
              Regístrate para actualizar tu perfil
            </Text>
            <Button title="Volver" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
      >
        <View style={styles.headerBackground}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        <ProfileHeader
          profile={profile}
          email={user?.primaryEmailAddress?.emailAddress}
          userImageUrl={user?.imageUrl || undefined}
          onChangeImage={handleChangeImage}
          isImageLoading={isImageLoading}
        />

        <ProfileDetails profile={profile} />
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
  headerBackground: {
    backgroundColor: "#FFFFFF",
    height: 10,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    marginLeft: 20,
    marginBottom: -70,
    marginTop: -60,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#ffffff",
    marginTop: -10,
  },
  container: {
    paddingTop: 20,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingVertical: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    position: "relative",
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    maxWidth: 300,
    alignSelf: "center",
    transform: [{ perspective: 1000 }, { translateY: 2 }],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f5f5f5",
    marginBottom: 8,
  },
  outsideContainer: {
    padding: 16,
    marginTop: 10,
    alignItems: "center",
  },
  registrationText: {
    fontSize: 16,
    color: "#1a1a1a",
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "barlow-medium",
  },
  userName: {
    fontSize: 16,
    fontFamily: "barlow-semibold",
    color: "#333",
    marginTop: 8,
    textAlign: "left",
  },
  userEmail: {
    fontSize: 14,
    fontFamily: "outfit-regular",
    color: "#777",
    marginTop: 2,
    textAlign: "left",
  },
});
