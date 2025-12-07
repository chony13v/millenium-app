import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type UserSummaryCardProps = {
  avatarUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
};

const UserSummaryCard = ({
  avatarUrl,
  fullName,
  email,
}: UserSummaryCardProps) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: avatarUrl ?? undefined }} style={styles.avatar} />
      <Text style={styles.userName}>{fullName}</Text>
      <Text style={styles.userEmail}>{email}</Text>
    </View>
  );
};

export default UserSummaryCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    width: "100%",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f8fafc",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  userName: {
    fontFamily: "barlow-semibold",
    fontSize: 21,
    color: "#0A2240",
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: "barlow-regular",
    fontSize: 14,
    color: "#475569",
    marginBottom: 4,
  },
});
