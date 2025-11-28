import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  Alert,
  StyleSheet,
  Keyboard,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Section1Form from "@/components/form/Section1Form";
import Section2Form from "@/components/form/Section2Form";
import Section3Form from "@/components/form/Section3Form";
import TermsModal from "@/components/modals/TermsModal";
import PrivacyModal from "@/components/modals/PrivacyModal";
import LoadingBall from "@/components/LoadingBall";
import ProfileStepper from "@/components/profile/ProfileStepper";
import {
  FORM_CONSTANTS,
  CITIES,
  POSITIONS,
  VALIDATION_PATTERNS,
} from "@/constants/FormConstants";
import { useSection1Form } from "@/hooks/profile/useSection1Form";
import { useSection2Form } from "@/hooks/profile/useSection2Form";
import { useSection3Form } from "@/hooks/profile/useSection3Form";
import {
  getExistingRegistration,
  saveProfile,
  showExistingRegistrationAlert,
  showTutorReminderAlert,
} from "@/services/profile/profilePersistence";

type RootStackParamList = {
  "(call)": undefined;
};

export default function Profile() {
  const { user } = useUser();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isLoading, setIsLoading] = useState(true);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const insets = useSafeAreaInsets();

  const section1 = useSection1Form();
  const section2 = useSection2Form();
  const section3 = useSection3Form();

  const errors = useMemo(
    () => ({ ...section1.errors, ...section2.errors, ...section3.errors }),
    [section1.errors, section2.errors, section3.errors]
  );

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  useEffect(() => {
    const checkExistingRegistration = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        const exists = await getExistingRegistration(user.id);
        if (exists) {
          showExistingRegistrationAlert(() =>
            navigation.reset({ index: 0, routes: [{ name: "(call)" }] })
          );
        } else {
          showTutorReminderAlert();
        }
      } catch (error) {
        console.error("Error checking registration:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkExistingRegistration();
  }, [navigation, user]);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const validateAndNext = () => {
    if (currentSection === 1) {
      if (section1.validateSection1()) setCurrentSection(2);
    } else if (currentSection === 2) {
      if (section2.validateSection2()) setCurrentSection(3);
      else {
        const missing: string[] = [];
        if (!section2.parentFullName.trim())
          missing.push("• Nombre completo del padre/tutor");
        if (!section2.relationship.trim())
          missing.push("• Relación con el niño");
        if (!section2.economicSituation.trim())
          missing.push("• Situación económica actual");
        if (
          section2.parentEmail.trim() &&
          !VALIDATION_PATTERNS.EMAIL.test(section2.parentEmail)
        )
          missing.push("• Correo electrónico válido (si se proporciona)");
        Alert.alert("Campos Obligatorios", missing.join("\n"));
      }
    } else {
      handleFinalize();
    }
  };

  const handleFinalize = async () => {
    if (!section3.validateSection3()) {
      const missing: string[] = [];
      if (!section3.consentimientoParticipacion)
        missing.push("• Consentimiento participación");
      if (!section3.autorizacionFotos)
        missing.push("• Autorización fotos/videos");
      if (!section3.acuerdoPrivacidad)
        missing.push("• Acuerdo política de privacidad");
      if (!section3.esRiobambeno)
        missing.push("• Confirma residencia en Riobamba");
      Alert.alert(
        "Consentimientos Requeridos",
        "Por favor acepta todos los consentimientos:\n\n" + missing.join("\n")
      );
      return;
    }

    if (!user) {
      Alert.alert("Usuario no autenticado");
      return;
    }

    try {
      await saveProfile(user.id, {
        fullName: section1.nombreCompleto,
        email: user.primaryEmailAddress?.emailAddress,
        idNumber: section1.idNumber,
        birthDate: section1.birthDate,
        edad: section1.calculateAge(section1.birthDate),
        position: section1.selectedPosition,
        city: section1.selectedCity,
        dateTime: section1.selectedDateTime,
        informacionMedica: section1.informacionMedica,
        afiliacionEquipo: section1.afiliacionEquipo,
        parentFullName: section2.parentFullName,
        relationship: section2.relationship,
        economicSituation: section2.economicSituation,
        parentPhoneNumber: section2.parentPhoneNumber,
        parentEmail: section2.parentEmail,
        consentimientoParticipacion: section3.consentimientoParticipacion,
        autorizacionFotos: section3.autorizacionFotos,
        acuerdoPrivacidad: section3.acuerdoPrivacidad,
        esRiobambeno: section3.esRiobambeno,
        registrationDate: new Date().toISOString(),
      });
      Alert.alert("¡Registro exitoso!", "Te contactaremos pronto.");
      navigation.reset({ index: 0, routes: [{ name: "(call)" }] });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo completar el registro.");
    }
  };

  const handlePreviousSection = () => {
    if (currentSection > 1) setCurrentSection(currentSection - 1);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingBall text="Verificando registro..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      <TermsModal
        visible={termsModalVisible}
        onClose={() => setTermsModalVisible(false)}
      />
      <PrivacyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />

      <ProfileStepper
        currentSection={currentSection}
        totalSections={3}
        title="Registro para el torneo selectivo 2025"
        isKeyboardVisible={isKeyboardVisible}
      />

      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: 24 + insets.bottom },
        ]}
      >
        <LinearGradient
          colors={["#0A2240", "#0ea5e9"]}
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
            Datos del jugador, tutor y consentimientos para el selectivo 2025.
            Todo alineado a la experiencia Ciudad FC.
          </Text>
          <View style={styles.heroTags}>
            <Text style={styles.heroTag}>Datos personales</Text>
            <Text style={styles.heroTag}>Tutor responsable</Text>
            <Text style={styles.heroTag}>Consentimientos</Text>
          </View>
        </LinearGradient>

        <View style={styles.card}>
          <Image source={{ uri: user?.imageUrl }} style={styles.avatar} />
          <Text style={styles.userName}>{user?.fullName}</Text>
          <Text style={styles.userEmail}>
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>

        {currentSection === 1 && (
          <Section1Form
            nombreCompleto={section1.nombreCompleto}
            idNumber={section1.idNumber}
            birthDate={section1.birthDate}
            selectedPosition={section1.selectedPosition}
            selectedCity={section1.selectedCity}
            selectedDateTime={section1.selectedDateTime}
            informacionMedica={section1.informacionMedica}
            afiliacionEquipo={section1.afiliacionEquipo}
            errors={errors}
            dateTimes={section1.dateTimes}
            positions={POSITIONS}
            cities={CITIES}
            handleNombreCompletoChange={section1.setNombreCompleto}
            handleIdNumberChange={section1.setIdNumber}
            handleBirthDateChange={section1.handleBirthDateChange}
            handleSelectedPositionChange={({ key }) =>
              section1.setSelectedPosition(key)
            }
            handleCityChange={section1.handleCityChange}
            setSelectedDateTime={section1.setSelectedDateTime}
            handleInformacionMedicaChange={section1.setInformacionMedica}
            handleAfiliacionEquipoChange={section1.setAfiliacionEquipo}
            handleNextSection={validateAndNext}
          />
        )}

        {currentSection === 2 && (
          <Section2Form
            parentFullName={section2.parentFullName}
            relationship={section2.relationship}
            economicSituation={section2.economicSituation}
            parentPhoneNumber={section2.parentPhoneNumber}
            parentEmail={section2.parentEmail}
            errors={errors}
            handleParentFullNameChange={section2.setParentFullName}
            handleRelationshipChange={({ key }) =>
              section2.setRelationship(key)
            }
            handleEconomicSituationChange={({ key }) =>
              section2.setEconomicSituation(key)
            }
            handleParentPhoneNumberChange={section2.setParentPhoneNumber}
            handleParentEmailChange={section2.setParentEmail}
            handlePreviousSection={handlePreviousSection}
            validateAndNext={validateAndNext}
          />
        )}

        {currentSection === 3 && (
          <Section3Form
            consentimientoParticipacion={section3.consentimientoParticipacion}
            autorizacionFotos={section3.autorizacionFotos}
            acuerdoPrivacidad={section3.acuerdoPrivacidad}
            esRiobambeno={section3.esRiobambeno}
            errors={errors}
            setConsentimientoParticipacion={
              section3.setConsentimientoParticipacion
            }
            setAutorizacionFotos={section3.setAutorizacionFotos}
            setAcuerdoPrivacidad={section3.setAcuerdoPrivacidad}
            setEsRiobambeno={section3.setEsRiobambeno}
            setTermsModalVisible={setTermsModalVisible}
            setPrivacyModalVisible={setPrivacyModalVisible}
            handlePreviousSection={handlePreviousSection}
            validateSection3={section3.validateSection3}
            saveProfile={handleFinalize}
          />
        )}

        <View style={styles.cancelContainer}>
          <Text
            onPress={() =>
              Alert.alert("Cancelar registro", "¿Seguro deseas cancelar?", [
                { text: "No", style: "cancel" },
                {
                  text: "Sí",
                  style: "destructive",
                  onPress: () =>
                    navigation.reset({
                      index: 0,
                      routes: [{ name: "(call)" }],
                    }),
                },
              ])
            }
            style={styles.cancelText}
          >
            ¿Deseas cancelar el registro?
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: 10,
  },

  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  heroCard: {
    width: "100%",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#0A2240",
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
  cancelContainer: {
    width: "100%",
    alignItems: "center",
    marginVertical: 20,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "barlow-medium",
    textDecorationLine: "underline",
    color: "#0A2240",
  },
});
