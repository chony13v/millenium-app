import {
  View,
  Text,
  Image,
  TextInput,
  Alert,
  StyleSheet,
  Keyboard,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import { db } from "@/config/FirebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation, NavigationProp } from "@react-navigation/native";

import Section1Form from "@/components/form/Section1Form";
import Section2Form from "@/components/form/Section2Form";
import Section3Form from "@/components/form/Section3Form";
import TermsModal from "@/components/modals/TermsModal";
import PrivacyModal from "@/components/modals/PrivacyModal";

import * as WebBrowser from "expo-web-browser";
import {
  FORM_CONSTANTS,
  VALIDATION_PATTERNS,
  COLORS,
  CITIES,
  POSITIONS,
  CITY_DATE_TIMES,
} from "@/constants/FormConstants";
import LoadingBall from "@/components/LoadingBall";

type RootStackParamList = {
  "(call)": undefined;
};

export default function Profile() {
  const { user } = useUser();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isLoading, setIsLoading] = useState(true);

  // Sección 1 & global
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [dateTimes, setDateTimes] = useState<{ key: string; label: string }[]>(
    []
  );
  const [informacionMedica, setInformacionMedica] = useState("");
  const [afiliacionEquipo, setAfiliacionEquipo] = useState("");

  // Sección 2
  const [parentFullName, setParentFullName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [economicSituation, setEconomicSituation] = useState(""); 
  const [parentPhoneNumber, setParentPhoneNumber] = useState("");
  const [parentEmail, setParentEmail] = useState("");

  // Sección 3
  const [consentimientoParticipacion, setConsentimientoParticipacion] =
    useState(false);
  const [autorizacionFotos, setAutorizacionFotos] = useState(false);
  const [acuerdoPrivacidad, setAcuerdoPrivacidad] = useState(false);
  const [esRiobambeno, setEsRiobambeno] = useState(false);              

  // Errores
  const [errors, setErrors] = useState<{
    nombreCompleto?: string;
    idNumber?: string;
    birthDate?: string;
    position?: string;
    city?: string;
    dateTime?: string;
    informacionMedica?: string;
    afiliacionEquipo?: string;
    parentFullName?: string;
    relationship?: string;
    parentEmail?: string;
    economicSituation?: string;           
    consentimientoParticipacion?: string;
    autorizacionFotos?: string;
    acuerdoPrivacidad?: string;
    esRiobambeno?: string;                 
  }>({});

  // UI state
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);

  // Warm up browser
  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  // Check existing registration
  useEffect(() => {
    const checkExistingRegistration = async () => {
      if (!user) return;
      try {
        const userRef = doc(db, "Participantes", user.id);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          Alert.alert(
            "Registro Existente",
            "Ya te encuentras registrado para el torneo selectivo.",
            [
              {
                text: "Entendido",
                onPress: () =>
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "(call)" }],
                  }),
              },
            ]
          );
        } else {
          Alert.alert(
            "Aviso Importante",
            "Este formulario debe ser completado por el tutor legal del aspirante.",
            [{ text: "Entendido" }]
          );
        }
      } catch (error) {
        console.error("Error checking registration:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkExistingRegistration();
  }, [user]);

  // Keyboard listeners
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

  // Helpers
  const calculateAge = (bdStr: string) => {
    const [d, m, y] = bdStr.split("/").map((n) => parseInt(n, 10));
    const bd = new Date(y, m - 1, d);
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const diff = today.getMonth() - bd.getMonth();
    if (diff < 0 || (diff === 0 && today.getDate() < bd.getDate())) age--;
    return age;
  };

  const handleBirthDateChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;
    if (cleaned.length >= 4)
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(
        2,
        4
      )}/${cleaned.slice(4, 8)}`;
    else if (cleaned.length >= 2) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    setBirthDate(formatted);

    if (!VALIDATION_PATTERNS.DATE.test(formatted)) {
      setErrors((prev) => ({ ...prev, birthDate: "Ingresa DD/MM/YYYY" }));
    } else {
      const age = calculateAge(formatted);
      if (
        age < FORM_CONSTANTS.AGE_RANGE.min ||
        age > FORM_CONSTANTS.AGE_RANGE.max
      ) {
        setErrors((prev) => ({
          ...prev,
          birthDate: "Edad debe estar entre 12 y 18 años",
        }));
      } else {
        setErrors((prev) => ({ ...prev, birthDate: undefined }));
      }
    }
  };

  // Validadores
  const validateSection1 = () => {
    const newErr: typeof errors = {};
    let ok = true;
    if (!nombreCompleto.trim()) {
      newErr.nombreCompleto = "Obligatorio";
      ok = false;
    }
    if (idNumber.length !== FORM_CONSTANTS.PHONE_LENGTH) {
      newErr.idNumber = "Debe tener 10 dígitos";
      ok = false;
    }
    if (!VALIDATION_PATTERNS.DATE.test(birthDate)) {
      newErr.birthDate = "Ingresa DD/MM/YYYY";
      ok = false;
    } else {
      const age = calculateAge(birthDate);
      if (
        age < FORM_CONSTANTS.AGE_RANGE.min ||
        age > FORM_CONSTANTS.AGE_RANGE.max
      ) {
        newErr.birthDate = "Edad debe estar entre 12 y 18 años";
        ok = false;
      }
    }
    if (!selectedPosition) {
      newErr.position = "Obligatorio";
      ok = false;
    }
    if (!selectedCity) {
      newErr.city = "Obligatorio";
      ok = false;
    }
    setErrors((prev) => ({ ...prev, ...newErr }));
    return ok;
  };

  const validateSection2 = () => {
    const newErr: typeof errors = {};
    let ok = true;
    if (!parentFullName.trim()) {
      newErr.parentFullName = "Obligatorio";
      ok = false;
    }
    if (!relationship.trim()) {
      newErr.relationship = "Obligatorio";
      ok = false;
    }
    if (!economicSituation.trim()) {
      newErr.economicSituation = "Obligatorio";
      ok = false;
    }
    if (parentEmail.trim() && !VALIDATION_PATTERNS.EMAIL.test(parentEmail)) {
      newErr.parentEmail = "Correo inválido";
      ok = false;
    }
    setErrors((prev) => ({ ...prev, ...newErr }));
    return ok;
  };

  const validateSection3 = () => {
    const newErr: typeof errors = {};
    let ok = true;
    if (!consentimientoParticipacion) {
      newErr.consentimientoParticipacion = "Requerido";
      ok = false;
    }
    if (!autorizacionFotos) {
      newErr.autorizacionFotos = "Requerido";
      ok = false;
    }
    if (!acuerdoPrivacidad) {
      newErr.acuerdoPrivacidad = "Requerido";
      ok = false;
    }
    if (!esRiobambeno) {
      newErr.esRiobambeno = "Requerido";
      ok = false;
    }
    setErrors((prev) => ({ ...prev, ...newErr }));
    return ok;
  };

  // Cambio de sección
  const validateAndNext = () => {
    if (currentSection === 1) {
      if (validateSection1()) setCurrentSection(2);
    } else if (currentSection === 2) {
      if (validateSection2()) setCurrentSection(3);
      else {
        const missing: string[] = [];
        if (!parentFullName.trim())
          missing.push("• Nombre completo del padre/tutor");
        if (!relationship.trim()) missing.push("• Relación con el niño");
        if (!economicSituation.trim())
          missing.push("• Situación económica actual");
        if (
          parentEmail.trim() &&
          !VALIDATION_PATTERNS.EMAIL.test(parentEmail)
        )
          missing.push("• Correo electrónico válido (si se proporciona)");
        Alert.alert("Campos Obligatorios", missing.join("\n"));
      }
    } else {
      handleFinalize();
    }
  };

  const handleFinalize = async () => {
    if (!validateSection3()) {
      const missing: string[] = [];
      if (!consentimientoParticipacion)
        missing.push("• Consentimiento participación");
      if (!autorizacionFotos)
        missing.push("• Autorización fotos/videos");
      if (!acuerdoPrivacidad)
        missing.push("• Acuerdo política de privacidad");
      if (!esRiobambeno) missing.push("• Confirma residencia en Riobamba");
      Alert.alert(
        "Consentimientos Requeridos",
        "Por favor acepta todos los consentimientos:\n\n" + missing.join("\n")
      );
      return;
    }

    // Guardar
    if (!user) {
      Alert.alert("Usuario no autenticado");
      return;
    }
    try {
      const userRef = doc(db, "Participantes", user.id);
      await setDoc(userRef, {
        fullName: nombreCompleto,
        email: user.primaryEmailAddress?.emailAddress,
        idNumber,
        birthDate,
        edad: calculateAge(birthDate),
        position: selectedPosition,
        city: selectedCity,
        dateTime: selectedDateTime,
        informacionMedica,
        afiliacionEquipo,
        // Sección 2
        parentFullName,
        relationship,
        economicSituation,
        parentPhoneNumber,
        parentEmail,
        // Sección 3
        consentimientoParticipacion,
        autorizacionFotos,
        acuerdoPrivacidad,
        esRiobambeno,                
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

  const handleCityChange = (opt: { key: string; label: string }) => {
    setSelectedCity(opt.key);
    setDateTimes(CITY_DATE_TIMES[opt.key] || []);
    setSelectedDateTime("");
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingBall text="Verificando registro..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TermsModal
        visible={termsModalVisible}
        onClose={() => setTermsModalVisible(false)}
      />
      <PrivacyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />

      {!isKeyboardVisible && (
        <Text style={styles.headerText}>
          Registro para el torneo selectivo 2025
        </Text>
      )}

      <KeyboardAwareScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Image source={{ uri: user?.imageUrl }} style={styles.avatar} />
          <Text style={styles.userName}>{user?.fullName}</Text>
          <Text style={styles.userEmail}>
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>

        {currentSection === 1 && (
          <Section1Form
            nombreCompleto={nombreCompleto}
            idNumber={idNumber}
            birthDate={birthDate}
            selectedPosition={selectedPosition}
            selectedCity={selectedCity}
            selectedDateTime={selectedDateTime}
            informacionMedica={informacionMedica}
            afiliacionEquipo={afiliacionEquipo}
            errors={errors}
            dateTimes={dateTimes}
            positions={POSITIONS}
            cities={CITIES}
            handleNombreCompletoChange={setNombreCompleto}
            handleIdNumberChange={setIdNumber}
            handleBirthDateChange={handleBirthDateChange}
            handleSelectedPositionChange={({ key }) =>
              setSelectedPosition(key)
            }
            handleCityChange={handleCityChange}
            setSelectedDateTime={setSelectedDateTime}
            handleInformacionMedicaChange={setInformacionMedica}
            handleAfiliacionEquipoChange={setAfiliacionEquipo}
            handleNextSection={validateAndNext}
          />
        )}

        {currentSection === 2 && (
          <Section2Form
            parentFullName={parentFullName}
            relationship={relationship}
            economicSituation={economicSituation} 
            parentPhoneNumber={parentPhoneNumber}
            parentEmail={parentEmail}
            errors={errors}
            handleParentFullNameChange={setParentFullName}
            handleRelationshipChange={({ key }) => setRelationship(key)}
            handleEconomicSituationChange={({ key }) => setEconomicSituation(key)}
            handleParentPhoneNumberChange={setParentPhoneNumber}
            handleParentEmailChange={setParentEmail}
            handlePreviousSection={handlePreviousSection}
            validateAndNext={validateAndNext}
          />
        )}

        {currentSection === 3 && (
          <Section3Form
            consentimientoParticipacion={consentimientoParticipacion}
            autorizacionFotos={autorizacionFotos}
            acuerdoPrivacidad={acuerdoPrivacidad}
            esRiobambeno={esRiobambeno}              
            errors={errors}
            setConsentimientoParticipacion={
              setConsentimientoParticipacion
            }
            setAutorizacionFotos={setAutorizacionFotos}
            setAcuerdoPrivacidad={setAcuerdoPrivacidad}
            setEsRiobambeno={setEsRiobambeno}        
            setTermsModalVisible={setTermsModalVisible}
            setPrivacyModalVisible={setPrivacyModalVisible}
            handlePreviousSection={handlePreviousSection}
            validateSection3={validateSection3}
            saveProfile={handleFinalize}
          />
        )}

        <View style={styles.cancelContainer}>
          <Text
            onPress={() =>
              Alert.alert(
                "Cancelar registro",
                "¿Seguro deseas cancelar?",
                [
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
                ]
              )
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
    backgroundColor: "#fff",
    marginHorizontal: 20,
  },
  headerText: {
    fontFamily: "barlow-semibold",
    fontSize: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f5f5f5",
    marginBottom: 12,
  },
  userName: {
    fontFamily: "barlow-semibold",
    fontSize: 20,
    color: "#222",
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: "barlow-regular",
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  cancelContainer: {
    width: "100%",
    alignItems: "center",
    marginVertical: 20,
  },
  cancelText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontFamily: "barlow-regular",
    textDecorationLine: "underline",
  },
});
