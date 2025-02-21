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
  FONTS,
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
  const [contactInfo, setContactInfo] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [parentGuardianName, setParentGuardianName] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [dateTimes, setDateTimes] = useState<{ key: string; label: string }[]>(
    []
  );
  const [errors, setErrors] = useState<{
    idNumber?: string;
    contactInfo?: string;
    birthDate?: string;
    terms?: string;
    position?: string;
    city?: string;
    guardian?: string;
    dateTime?: string;
    afiliacionEquipo?: string;
    informacionMedica?: string;
    nombreCompleto?: string;
    parentFullName?: string;
    relationship?: string;
    parentPhoneNumber?: string;
    parentEmail?: string;
    consentimientoParticipacion?: string;
    autorizacionFotos?: string;
    acuerdoPrivacidad?: string;
  }>({});
  
  const [informacionMedica, setInformacionMedica] = useState("");
  const [parentFullName, setParentFullName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [parentPhoneNumber, setParentPhoneNumber] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [afiliacionEquipo, setAfiliacionEquipo] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");

  const idNumberRef = React.useRef<TextInput>(null);
  const contactInfoRef = React.useRef<TextInput>(null);
  const parentGuardianRef = React.useRef<TextInput>(null);
  const birthDateRef = React.useRef<TextInput>(null);

  const [currentSection, setCurrentSection] = useState(1);

  const [consentimientoParticipacion, setConsentimientoParticipacion] =
    useState(false);
  const [autorizacionFotos, setAutorizacionFotos] = useState(false);
  const [acuerdoPrivacidad, setAcuerdoPrivacidad] = useState(false);

  const [termsModalVisible, setTermsModalVisible] = useState(false);

  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  useEffect(() => {
    const checkExistingRegistration = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, "Participantes", user.id);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          Alert.alert(
            "Registro Existente",
            "Ya te encuentras registrado para el torneo selectivo. Si tienes preguntas o necesitas actualizar tu información, por favor contáctanos a través de nuestros canales oficiales.",
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
            "Por favor, tenga en cuenta que este formulario debe ser completado por el padre, madre o tutor legal del joven aspirante al torneo.\n\nAsegúrese de que toda la información proporcionada sea precisa y esté actualizada.",
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
  }, [user, navigation]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const calculateAge = (birthDateStr: string) => {
    const [day, month, year] = birthDateStr
      .split("/")
      .map((num) => parseInt(num));
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleBirthDateChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;

    if (cleaned.length >= 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(
        2,
        4
      )}/${cleaned.slice(4, 8)}`;
    } else if (cleaned.length >= 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }

    setBirthDate(formatted);

    if (!formatted.match(VALIDATION_PATTERNS.DATE)) {
      setErrors((prev) => ({
        ...prev,
        birthDate: "Ingresa una fecha válida (DD/MM/YYYY)",
      }));
    } else {
      const age = calculateAge(formatted);
      if (
        age < FORM_CONSTANTS.AGE_RANGE.min ||
        age > FORM_CONSTANTS.AGE_RANGE.max
      ) {
        setErrors((prev) => ({
          ...prev,
          birthDate: "La edad debe estar entre 13 y 20 años",
        }));
      } else {
        setErrors((prev) => ({ ...prev, birthDate: undefined }));
      }
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors: {
      nombreCompleto?: string;
      informacionMedica?: string;
      afiliacionEquipo?: string;
      birthDate?: string;
      terms?: string;
      position?: string;
      city?: string;
      dateTime?: string;
      parentFullName?: string;
      relationship?: string;
      parentPhoneNumber?: string;
      parentEmail?: string;
      consentimientoParticipacion?: string;
      autorizacionFotos?: string;
      acuerdoPrivacidad?: string;
    } = {};

    if (!nombreCompleto.trim()) {
      newErrors.nombreCompleto = "Debes ingresar el nombre completo";
      isValid = false;
    }

    if (
      afiliacionEquipo &&
      afiliacionEquipo.length > FORM_CONSTANTS.MAX_AFFILIATION_LENGTH
    ) {
      newErrors.afiliacionEquipo =
        "La afiliación no debe exceder 50 caracteres";
      isValid = false;
    }

    if (!birthDate || !VALIDATION_PATTERNS.DATE.test(birthDate)) {
      newErrors.birthDate = "Ingresa una fecha válida (DD/MM/YYYY)";
      isValid = false;
    } else {
      const age = calculateAge(birthDate);
      if (
        age < FORM_CONSTANTS.AGE_RANGE.min ||
        age > FORM_CONSTANTS.AGE_RANGE.max
      ) {
        newErrors.birthDate = "La edad debe estar entre 13 y 20 años";
        isValid = false;
      }
    }

    if (!selectedPosition) {
      newErrors.position = "Debes seleccionar una posición";
      isValid = false;
    }

    if (!selectedCity) {
      newErrors.city = "Debes seleccionar una ciudad";
      isValid = false;
    }

    if (!selectedDateTime) {
      newErrors.dateTime = "Debes seleccionar una fecha y hora";
      isValid = false;
    }

    if (currentSection === 2) {
      if (!parentFullName.trim()) {
        newErrors.parentFullName =
          "Debes ingresar el nombre completo del padre/madre/tutor";
        isValid = false;
      }

      if (!relationship.trim()) {
        newErrors.relationship = "Debes seleccionar la relación con el niño";
        isValid = false;
      }

      if (!parentPhoneNumber.trim()) {
        newErrors.parentPhoneNumber = "Debes ingresar el número de teléfono";
        isValid = false;
      } else if (!VALIDATION_PATTERNS.PHONE.test(parentPhoneNumber)) {
        newErrors.parentPhoneNumber =
          "El número de teléfono debe tener 10 dígitos";
        isValid = false;
      }

      if (parentEmail.trim() && !VALIDATION_PATTERNS.EMAIL.test(parentEmail)) {
        newErrors.parentEmail = "Ingresa un correo electrónico válido";
        isValid = false;
      }
    }

    if (currentSection === 3) {
      if (!consentimientoParticipacion) {
        newErrors.consentimientoParticipacion =
          "Debes dar tu consentimiento para la participación";
        isValid = false;
      }
      if (!autorizacionFotos) {
        newErrors.autorizacionFotos = "Debes autorizar el uso de fotos/videos";
        isValid = false;
      }
      if (!acuerdoPrivacidad) {
        newErrors.acuerdoPrivacidad = "Debes aceptar la política de privacidad";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateSection1 = () => {
    const newErrors: {
      nombreCompleto?: string;
      birthDate?: string;
      position?: string;
      idNumber?: string;
      city?: string;
    } = {};

    let isValid = true;

    if (!nombreCompleto.trim()) {
      newErrors.nombreCompleto = "El nombre completo es obligatorio";
      isValid = false;
    }

    if (!idNumber) {
      newErrors.idNumber = "El número de cédula es obligatorio";
      isValid = false;
    } else if (idNumber.length !== FORM_CONSTANTS.PHONE_LENGTH) {
      newErrors.idNumber = "El número de cédula debe tener 10 dígitos";
      isValid = false;
    }

    if (!birthDate || !VALIDATION_PATTERNS.DATE.test(birthDate)) {
      newErrors.birthDate = "Ingresa una fecha válida (DD/MM/YYYY)";
      isValid = false;
    } else {
      const age = calculateAge(birthDate);
      if (
        age < FORM_CONSTANTS.AGE_RANGE.min ||
        age > FORM_CONSTANTS.AGE_RANGE.max
      ) {
        newErrors.birthDate = "La edad debe estar entre 13 y 20 años";
        isValid = false;
      }
    }

    if (!selectedPosition) {
      newErrors.position = "Debes seleccionar una posición";
      isValid = false;
    }

    if (!selectedCity) {
      newErrors.city = "Debes seleccionar una ciudad para el torneo";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateSection2 = () => {
    const newErrors: {
      parentFullName?: string;
      relationship?: string;
      parentPhoneNumber?: string;
      parentEmail?: string;
    } = {};

    let isValid = true;

    if (!parentFullName.trim()) {
      newErrors.parentFullName =
        "Debes ingresar el nombre completo del padre/tutor";
      isValid = false;
    }

    if (!relationship.trim()) {
      newErrors.relationship = "Debes seleccionar la relación con el niño";
      isValid = false;
    }

    if (!parentPhoneNumber.trim()) {
      newErrors.parentPhoneNumber = "Debes ingresar el número de teléfono";
      isValid = false;
    } else if (!VALIDATION_PATTERNS.PHONE.test(parentPhoneNumber)) {
      newErrors.parentPhoneNumber =
        "El número de teléfono debe tener 10 dígitos";
      isValid = false;
    }

    if (parentEmail.trim()) {
      if (!VALIDATION_PATTERNS.EMAIL.test(parentEmail)) {
        newErrors.parentEmail =
          "Ingresa un correo electrónico válido (ejemplo@dominio.com)";
        isValid = false;
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const validateSection3 = () => {
    const newErrors: {
      consentimientoParticipacion?: string;
      autorizacionFotos?: string;
      acuerdoPrivacidad?: string;
    } = {};

    let isValid = true;

    if (!consentimientoParticipacion) {
      newErrors.consentimientoParticipacion =
        "Debes aceptar el consentimiento de participación";
      isValid = false;
    }

    if (!autorizacionFotos) {
      newErrors.autorizacionFotos = "Debes autorizar el uso de fotos y videos";
      isValid = false;
    }

    if (!acuerdoPrivacidad) {
      newErrors.acuerdoPrivacidad = "Debes aceptar la política de privacidad";
      isValid = false;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const handleIdNumberChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    if (numericValue.length <= FORM_CONSTANTS.PHONE_LENGTH) {
      setIdNumber(numericValue);

      if (numericValue.length !== FORM_CONSTANTS.PHONE_LENGTH) {
        setErrors((prev) => ({
          ...prev,
          idNumber: "El número de cédula debe tener 10 dígitos",
        }));
      } else {
        setErrors((prev) => ({ ...prev, idNumber: undefined }));
      }
    }
  };

  const handleContactInfoChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    setContactInfo(numericValue);
  };

  const handleParentNameChange = (text: string) => {
    const letterOnlyValue = text.replace(/[^a-záéíóúüñÁÉÍÓÚÜÑA-Z\s-]/g, "");
    setParentGuardianName(letterOnlyValue);
  };

  const saveProfile = async () => {
    try {
      if (!validateForm()) {
        alert("Por favor completa todos los campos requeridos");
        return;
      }

      if (!user) {
        alert("El usuario no ha iniciado sesión");
        return;
      }

      if (!validateSection3()) {
        Alert.alert(
          "Consentimientos Requeridos",
          "Debes aceptar todos los consentimientos para poder completar el registro."
        );
        return;
      }

      const userRef = doc(db, "Participantes", user.id);
      await setDoc(userRef, {
        fullName: nombreCompleto,
        email: user.primaryEmailAddress?.emailAddress,
        idNumber: idNumber,
        informacionMedica: informacionMedica,
        afiliacionEquipo: afiliacionEquipo,
        city: selectedCity,
        position: selectedPosition,
        birthDate: birthDate,
        edad: calculateAge(birthDate),
        registrationDate: new Date().toISOString(),
        dateTime: selectedDateTime,
        // Sección 2: Información del Padre/Tutor
        parentFullName,
        relationship,
        parentPhoneNumber,
        parentEmail,
        consentimientoParticipacion,
        autorizacionFotos,
        acuerdoPrivacidad,
      });
      Alert.alert(
        "¡Registro Exitoso!",
        "¡Gracias por registrarte!\n\nTe contactaremos pronto."
      );
      navigation.reset({
        index: 0,
        routes: [{ name: "(call)" }],
      });
    } catch (error) {
      console.error("Error al guardar el registro: ", error);
      Alert.alert(
        "Error de Registro",
        "Lo sentimos, hubo un problema al procesar tu registro.\nPor favor intenta nuevamente o contáctanos directamente.", // Message
        [{ text: "OK" }]
      );
    }
  };

  const handleCancelRegistration = () => {
    Alert.alert(
      "Cancelar Registro",
      "¿Estás seguro de cancelar el registro? Tendrás que completar nuevamente la información para poder registrarte.",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Sí",
          onPress: () =>
            navigation.reset({
              index: 0,
              routes: [{ name: "(call)" }],
            }),
          style: "destructive",
        },
      ]
    );
  };

  const handleCityChange = (option: { key: string; label: string }) => {
    setSelectedCity(option.key);
    setSelectedDateTime("");
    setDateTimes(CITY_DATE_TIMES[option.key] || []);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingBall text="Verificando registro..." />
      </View>
    );
  }

  const textInputStyle = {
    height: 40,
    borderWidth: 1,
    width: "100%",
    paddingHorizontal: 10,
    color: COLORS.TEXT_BLACK,
  };

  const handleNombreCompletoChange = (text: string) => {
    const letterOnlyValue = text.replace(/[^a-záéíóúüñÁÉÍÓÚÜÑA-Z\s-]/g, "");
    setNombreCompleto(letterOnlyValue);

    if (!letterOnlyValue.trim()) {
      setErrors((prev) => ({
        ...prev,
        nombreCompleto: "El nombre completo es obligatorio",
      }));
    } else {
      setErrors((prev) => ({ ...prev, nombreCompleto: undefined }));
    }
  };
  const handleInformacionMedicaChange = (text: string) => {
    setInformacionMedica(text);
  };
  const handleAfiliacionEquipoChange = (text: string) => {
    const validValue = text.replace(/[^a-zA-Z0-9\s-]/g, "");
    setAfiliacionEquipo(validValue);
  };

  const handleRelationshipChange = (option: { key: string; label: string }) => {
    setRelationship(option.key);

    if (!option.key) {
      setErrors((prev) => ({
        ...prev,
        relationship: "Debes seleccionar la relación con el niño",
      }));
    } else {
      setErrors((prev) => ({ ...prev, relationship: undefined }));
    }
  };

  const handleParentFullNameChange = (text: string) => {
    const letterOnlyValue = text.replace(/[^a-záéíóúüñÁÉÍÓÚÜÑA-Z\s-]/g, "");
    setParentFullName(letterOnlyValue);

    if (!letterOnlyValue.trim()) {
      setErrors((prev) => ({
        ...prev,
        parentFullName: "Debes ingresar el nombre completo del padre/tutor",
      }));
    } else {
      setErrors((prev) => ({ ...prev, parentFullName: undefined }));
    }
  };

  const handleParentPhoneNumberChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    if (numericValue.length <= FORM_CONSTANTS.PHONE_LENGTH) {
      setParentPhoneNumber(numericValue);

      if (!numericValue) {
        setErrors((prev) => ({
          ...prev,
          parentPhoneNumber: "Debes ingresar el número de teléfono",
        }));
      } else {
        setErrors((prev) => ({ ...prev, parentPhoneNumber: undefined }));
      }
    }
  };

  const handleParentEmailChange = (text: string) => {
    setParentEmail(text);
    const emailRegex = VALIDATION_PATTERNS.EMAIL;

    // Only validate format if email is provided
    if (text.trim() && !emailRegex.test(text)) {
      setErrors((prev) => ({
        ...prev,
        parentEmail:
          "Ingresa un correo electrónico válido (ejemplo@dominio.com)",
      }));
    } else {
      setErrors((prev) => ({ ...prev, parentEmail: undefined }));
    }
  };

  const handleSelectedPositionChange = (option: {
    key: string;
    label: string;
  }) => {
    setSelectedPosition(option.key);

    if (!option.key) {
      setErrors((prev) => ({
        ...prev,
        position: "Debes seleccionar una posición",
      }));
    } else {
      setErrors((prev) => ({ ...prev, position: undefined }));
    }
  };

  const handleNextSection = () => {
    if (validateSection1()) {
      setCurrentSection(2);
    } else {
      const missingFields = [];
      if (!nombreCompleto.trim())
        missingFields.push("• Nombre completo del niño");
      if (!idNumber || idNumber.length !== FORM_CONSTANTS.PHONE_LENGTH)
        missingFields.push("• Número de cédula");
      if (!birthDate || !VALIDATION_PATTERNS.DATE.test(birthDate))
        missingFields.push("• Fecha de nacimiento");
      if (!selectedPosition) missingFields.push("• Posición favorita");
      if (!selectedCity) missingFields.push("• Ubicación del torneo");

      Alert.alert(
        "Campos Obligatorios",
        "Por favor completa los siguientes campos obligatorios:\n\n" +
          missingFields.join("\n")
      );
    }
  };

  const handlePreviousSection = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };
  function validateAndNext() {
    if (validateSection2()) {
      setCurrentSection(3);
    } else {
      const missingFields = [];
      if (!parentFullName.trim())
        missingFields.push("• Nombre completo del padre/tutor");
      if (!relationship.trim()) missingFields.push("• Relación con el niño");
      if (
        !parentPhoneNumber.trim() ||
        !VALIDATION_PATTERNS.PHONE.test(parentPhoneNumber)
      )
        missingFields.push("• Número de teléfono válido");
      if (parentEmail.trim() && !VALIDATION_PATTERNS.EMAIL.test(parentEmail))
        missingFields.push("• Correo electrónico válido (si se proporciona)");

      Alert.alert(
        "Campos Obligatorios",
        "Por favor completa los siguientes campos obligatorios:\n\n" +
          missingFields.join("\n")
      );
    }
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
          Registro para el torneo selectivo 2025:
        </Text>
      )}
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
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
            handleNombreCompletoChange={handleNombreCompletoChange}
            handleIdNumberChange={handleIdNumberChange}
            handleBirthDateChange={handleBirthDateChange}
            handleSelectedPositionChange={handleSelectedPositionChange}
            handleCityChange={handleCityChange}
            setSelectedDateTime={setSelectedDateTime}
            handleInformacionMedicaChange={handleInformacionMedicaChange}
            handleAfiliacionEquipoChange={handleAfiliacionEquipoChange}
            handleNextSection={handleNextSection}
          />
        )}

        {currentSection === 2 && (
          <Section2Form
            parentFullName={parentFullName}
            relationship={relationship}
            parentPhoneNumber={parentPhoneNumber}
            parentEmail={parentEmail}
            errors={errors}
            handleParentFullNameChange={handleParentFullNameChange}
            handleRelationshipChange={handleRelationshipChange}
            handleParentPhoneNumberChange={handleParentPhoneNumberChange}
            handleParentEmailChange={handleParentEmailChange}
            handlePreviousSection={handlePreviousSection}
            validateAndNext={validateAndNext}
          />
        )}

        {currentSection === 3 && (
          <Section3Form
            consentimientoParticipacion={consentimientoParticipacion}
            autorizacionFotos={autorizacionFotos}
            acuerdoPrivacidad={acuerdoPrivacidad}
            errors={errors}
            setConsentimientoParticipacion={setConsentimientoParticipacion}
            setAutorizacionFotos={setAutorizacionFotos}
            setAcuerdoPrivacidad={setAcuerdoPrivacidad}
            setTermsModalVisible={setTermsModalVisible}
            setPrivacyModalVisible={setPrivacyModalVisible}
            handlePreviousSection={() => setCurrentSection(2)}
            validateSection3={validateSection3}
            saveProfile={saveProfile}
          />
        )}
        <View
          style={{
            width: "100%",
            alignItems: "center",
            marginTop: 30,
            marginBottom: 20,
          }}
        >
          <Text
            onPress={handleCancelRegistration}
            style={{
              color: "#1a1a1a",
              fontSize: 16,
              fontFamily: "barlow-regular",
              textDecorationLine: "underline",
              textAlign: "center",
              paddingVertical: 10,
            }}
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
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 16,
    marginTop: 5,
    marginBottom: 5,
    alignItems: "center",
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
    color: "#222222",
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: "barlow-regular",
    fontSize: 16,
    color: "#666666",
    marginBottom: 4,
  },
  cancelText: {
    color: "#222222",
    fontSize: 16,
    fontFamily: "barlow-regular",
    textDecorationLine: "underline",
    textAlign: "center",
    paddingVertical: 10,
  },
});
