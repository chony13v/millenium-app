import React, { useMemo } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Profile } from "@/services/profile/profileScreenData";
import type { CityId } from "@/constants/cities";

interface ProfileDetailsProps {
  profile: Profile;
  selectedCity?: CityId | null;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({
  profile,
  selectedCity,
}) => {
  const cityLogo = useMemo(() => {
    const profileCity = profile.city?.toLowerCase() ?? "";

    if (selectedCity === "riobamba" || profileCity.includes("riobamba")) {
      return require("@/assets/images/logo_alcaldiaRiobamba.png");
    }
    if (selectedCity === "manabi" || profileCity.includes("manab")) {
      return require("@/assets/images/manabi_logo.png");
    }
    return require("@/assets/images/LogoFC.png");
  }, [profile.city, selectedCity]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Información de Registro</Text>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>N° Participante</Text>
            <Text style={styles.badgeValue}>
              {profile.uniqueNumber || "Generando..."}
            </Text>
          </View>
          <View style={[styles.badge, styles.badgeSecondary]}>
            <Text style={styles.badgeLabel}>Fecha registro</Text>
            <Text style={styles.badgeValue}>
              {profile.registrationDate?.split?.("T")[0] ?? "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.registrationInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lugar y fecha de la prueba</Text>
            <Text style={styles.infoValue}>{profile.dateTime}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Número de Identificación</Text>
            <Text style={styles.infoValue}>{profile.idNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de Nacimiento</Text>
            <Text style={styles.infoValue}>{profile.birthDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Información médica</Text>
            <Text style={styles.infoValue}>{profile.informacionMedica}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Padre/Madre/Tutor</Text>
            <Text style={styles.infoValue}>
              {profile.parentFullName} ({profile.relationship})
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Situación Económica</Text>
            <Text style={styles.infoValue}>{profile.economicSituation}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contacto</Text>
            <Text style={styles.infoValue}>{profile.parentPhoneNumber}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footerCard}>
        <View style={styles.logoBackground}>
          <Image source={cityLogo} style={styles.logo} />
        </View>
        <Text style={styles.supportMessage}>
          Si deseas cambiar tu información, contacta a info@milleniumfc.com
        </Text>
      </View>
    </View>
  );
};

export default ProfileDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: "barlow-semibold",
    color: "#0A2240",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 10,
  },
  badge: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#0A2240",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  badgeSecondary: {
    backgroundColor: "#0ea5e9",
    borderColor: "rgba(255,255,255,0.1)",
  },
  badgeLabel: {
    fontSize: 12,
    fontFamily: "barlow-medium",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.3,
  },
  badgeValue: {
    marginTop: 4,
    fontSize: 16,
    fontFamily: "barlow-semibold",
    color: "white",
  },
  registrationInfo: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: "barlow-medium",
    color: "#0A2240",
    width: "44%",
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: "barlow-regular",
    color: "#475569",
    lineHeight: 18,
  },
  uniqueNumber: {
    fontFamily: "barlow-semibold",
    fontSize: 16,
    color: "#4630EB",
  },
  footerCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    gap: 10,
  },
  logoBackground: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 60,
    resizeMode: "contain",
  },
  supportMessage: {
    marginTop: 2,
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
    fontFamily: "barlow-regular",
    lineHeight: 18,
  },
});
