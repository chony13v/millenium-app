import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Profile } from "@/services/profile/profileScreenData";

interface ProfileDetailsProps {
  profile: Profile;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ profile }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Información de Registro:</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Número de Participante:</Text>
        <Text style={[styles.infoValue, styles.uniqueNumber]}>
          {profile.uniqueNumber || "Generando..."}
        </Text>
      </View>

      <View style={styles.registrationInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Lugar y fecha de la prueba:</Text>
          <Text style={styles.infoValue}>{profile.dateTime}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Número de Identificación:</Text>
          <Text style={styles.infoValue}>{profile.idNumber}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fecha de Nacimiento:</Text>
          <Text style={styles.infoValue}>{profile.birthDate}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Información médica</Text>
          <Text style={styles.infoValue}>{profile.informacionMedica}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nombre de Padre/Madre/Tutor:</Text>
          <Text style={styles.infoValue}>
            {profile.parentFullName} ({profile.relationship})
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Situación Económica:</Text>
          <Text style={styles.infoValue}>{profile.economicSituation}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Contacto:</Text>
          <Text style={styles.infoValue}>{profile.parentPhoneNumber}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fecha de Registro:</Text>
          <Text style={styles.infoValue}>
            {profile.registrationDate.split("T")[0]}
          </Text>
        </View>
      </View>

      <View style={styles.logoBackground}>
        <Image
          source={require("@/assets/images/logo_alcaldiaRiobamba.png")}
          style={styles.logo}
        />
      </View>
      <Text style={styles.supportMessage}>
        Si deseas cambiar tu información, por favor contacta con soporte al
        siguiente correo electrónico: info@milleniumfc.com
      </Text>
    </View>
  );
};

export default ProfileDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: "barlow-semibold",
    marginBottom: 20,
    color: "#1a1a1a",
  },
  registrationInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: "barlow-medium",
    color: "#1a1a1a",
    width: "40%",
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: "barlow-regular",
    color: "#1a1a1a",
  },
  uniqueNumber: {
    fontFamily: "barlow-semibold",
    fontSize: 16,
    color: "#4630EB",
  },
  logoBackground: {
    backgroundColor: "#ffffff",
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 5,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logo: {
    width: 200,
    height: 60,
    resizeMode: "contain",
  },
  supportMessage: {
    marginTop: 15,
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    fontFamily: "barlow-regular",
  },
});