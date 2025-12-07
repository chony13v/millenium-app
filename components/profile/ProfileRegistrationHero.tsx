import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

const ProfileRegistrationHero = () => {
  return (
    <LinearGradient
      colors={["#1e3a8a", "#1e3a8a"]}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.heroCard}
    >
      <View style={styles.heroRow}>
        <Text style={styles.heroBadge}>Registro</Text>
        <Text style={styles.heroPill}>3 pasos</Text>
      </View>
      <Text style={styles.heroTitle}>Completa tu postulación</Text>
      <Text style={styles.heroSubtitle}>
        Datos del jugador, tutor y consentimientos para el selectivo.
      </Text>
      <View style={styles.heroTags}>
        <Text style={styles.heroTag}>Datos personales</Text>
        <Text style={styles.heroTag}>Tutor responsable</Text>
        <Text style={styles.heroTag}>Consentimientos</Text>
      </View>
    </LinearGradient>
  );
};

export default ProfileRegistrationHero;

const styles = StyleSheet.create({
  heroCard: {
    width: "100%",
    borderRadius: 18,
    padding: 18,
    marginTop: 6,
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    color: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontFamily: "barlow-semibold",
    letterSpacing: 0.4,
    fontSize: 12,
  },
  heroPill: {
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "white",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontFamily: "barlow-medium",
    fontSize: 12,
  },
  heroTitle: {
    color: "white",
    fontFamily: "barlow-semibold",
    fontSize: 22,
    marginTop: 12,
    lineHeight: 28,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: "barlow-regular",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  heroTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  heroTag: {
    color: "white",
    fontFamily: "barlow-medium",
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
});
