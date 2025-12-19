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
          </View>
          <Text style={styles.userName}>{profile.fullName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
          <View style={styles.chipsRow}>
            <View style={styles.cityChip}>
              <Image
                source={require("@/assets/images/company.png")}
                style={styles.cityIcon}
              />
              <Text style={styles.cityText}>{profile.city}</Text>
            </View>
            <View style={styles.positionChip}>
              <Text style={styles.positionText}>{profile.position}</Text>
            </View>
          </View>
        </View>
        <View style={styles.rightColumn}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>Registro activo</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProfileHeader;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  checkIcon: {
    position: "absolute",
    width: 20,
    height: 20,
    bottom: 0,
    right: 0,
  },
  userName: {
    fontSize: 16,
    fontFamily: "barlow-semibold",
    color: "#0A2240",
    marginTop: 8,
    textAlign: "left",
  },
  userEmail: {
    fontSize: 13,
    fontFamily: "barlow-regular",
    color: "#64748b",
    marginTop: 2,
    textAlign: "left",
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  cityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cityIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  cityText: {
    fontSize: 13,
    fontFamily: "barlow-medium",
    color: "#0A2240",
  },
  positionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(14,165,233,0.12)",
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  positionText: {
    fontSize: 13,
    fontFamily: "barlow-semibold",
    color: "#0ea5e9",
  },
  metaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#0A2240",
  },
  metaBadgeText: {
    color: "white",
    fontFamily: "barlow-semibold",
    fontSize: 12,
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
