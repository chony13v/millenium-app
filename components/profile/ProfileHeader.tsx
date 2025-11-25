import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Profile } from "@/services/profile/profileScreenData";

interface ProfileHeaderProps {
  profile: Profile;
  email?: string;
  userImageUrl?: string;
  onChangeImage: () => void;
  isImageLoading: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  email,
  userImageUrl,
  onChangeImage,
  isImageLoading,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.profileRow}>
        <View style={styles.leftColumn}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={onChangeImage} disabled={isImageLoading}>
              <Image
                source={{ uri: profile.imageUrl || userImageUrl }}
                style={styles.avatar}
              />
              {isImageLoading && (
                <View style={styles.loadingOverlay}>
                  <Text style={styles.loadingText}>...</Text>
                </View>
              )}
            </TouchableOpacity>
            <Image
              source={require("@/assets/images/verify.png")}
              style={styles.checkIcon}
            />
            <Image
              source={require("@/assets/images/LogoFC.png")}
              style={styles.logoIcon}
            />
          </View>
          <Text style={styles.userName}>{profile.fullName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
          <View style={styles.cityContainer}>
            <Image
              source={require("@/assets/images/company.png")}
              style={styles.cityIcon}
            />
            <Text style={styles.cityText}>{profile.city}</Text>
          </View>
        </View>
        <View style={styles.rightColumn}>
          <Text style={styles.position}>{profile.position}</Text>
          <View style={styles.separator} />
          <Text style={styles.age}>
            {profile.edad ? `${profile.edad} años` : "N/A"}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ProfileHeader;

const styles = StyleSheet.create({
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
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  leftColumn: {
    alignItems: "flex-start",
  },
  rightColumn: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    width: 80,
    height: 80,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f5f5f5",
    marginBottom: 8,
  },
  checkIcon: {
    position: "absolute",
    width: 20,
    height: 20,
    bottom: 0,
    right: 0,
  },
  logoIcon: {
    position: "absolute",
    width: 20,
    height: 20,
    bottom: -75,
    right: -170,
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
  cityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  cityIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  cityText: {
    fontSize: 14,
    fontFamily: "outfit-medium",
    color: "#666",
  },
  position: {
    fontSize: 14,
    fontFamily: "outfit-medium",
    color: "#4630EB",
    marginHorizontal: -10,
  },
  age: {
    fontSize: 13,
    fontFamily: "outfit-regular",
    color: "#000000",
    marginTop: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    width: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 80,
    height: 80,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    fontFamily: "barlow-semibold",
  },
});