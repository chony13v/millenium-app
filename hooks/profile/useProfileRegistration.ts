import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Keyboard } from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { useUser } from "@clerk/clerk-expo";

import { VALIDATION_PATTERNS } from "@/constants/formConstants";
import { useFirebaseUid } from "@/hooks/useFirebaseUid";
import { useSection1Form } from "@/hooks/profile/useSection1Form";
import { useSection2Form } from "@/hooks/profile/useSection2Form";
import { useSection3Form } from "@/hooks/profile/useSection3Form";
import { ensurePointsProfile } from "@/services/points/pointsProfile";
import {
  getExistingRegistration,
  saveProfile,
  showExistingRegistrationAlert,
  showTutorReminderAlert,
} from "@/services/profile/profilePersistence";

type RootStackParamList = {
  "(call)": undefined;
};

export const useProfileRegistration = () => {
  const { user } = useUser();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { firebaseUid, loadingFirebaseUid } = useFirebaseUid();

  const section1 = useSection1Form();
  const section2 = useSection2Form();
  const section3 = useSection3Form();

  const [isLoading, setIsLoading] = useState(true);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);

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

  const handleCancelRegistration = useCallback(() => {
    Alert.alert("Cancelar registro", "¿Seguro deseas cancelar?", [
      { text: "No", style: "cancel" },
      {
        text: "Sí",
        style: "destructive",
        onPress: () =>
          navigation.reset({ index: 0, routes: [{ name: "(call)" }] }),
      },
    ]);
  }, [navigation]);

  const handleFinalize = useCallback(async () => {
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

    if (loadingFirebaseUid || !firebaseUid) {
      Alert.alert(
        "Conectando",
        "Estamos terminando de enlazar tu sesión. Intenta nuevamente en unos segundos."
      );
      return;
    }

    try {
      const userEmail = user.primaryEmailAddress?.emailAddress ?? null;
      const pointsProfileId = firebaseUid;
      await saveProfile(user.id, {
        fullName: section1.nombreCompleto,
        email: userEmail ?? undefined,
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
      await ensurePointsProfile(pointsProfileId, userEmail);
      Alert.alert("¡Registro exitoso!", "Te contactaremos pronto.");
      navigation.reset({ index: 0, routes: [{ name: "(call)" }] });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo completar el registro.");
    }
  }, [
    firebaseUid,
    navigation,
    section1.afiliacionEquipo,
    section1.birthDate,
    section1.calculateAge,
    section1.idNumber,
    section1.informacionMedica,
    section1.nombreCompleto,
    section1.selectedCity,
    section1.selectedDateTime,
    section1.selectedPosition,
    section2.economicSituation,
    section2.parentEmail,
    section2.parentFullName,
    section2.parentPhoneNumber,
    section2.relationship,
    section3.acuerdoPrivacidad,
    section3.autorizacionFotos,
    section3.consentimientoParticipacion,
    section3.esRiobambeno,
    section3.validateSection3,
    user,
  ]);

  const validateAndNext = useCallback(() => {
    if (currentSection === 1) {
      if (section1.validateSection1()) setCurrentSection(2);
      return;
    }

    if (currentSection === 2) {
      if (section2.validateSection2()) {
        setCurrentSection(3);
        return;
      }

      const missing: string[] = [];
      if (!section2.parentFullName.trim())
        missing.push("• Nombre completo del padre/tutor");
      if (!section2.relationship.trim()) missing.push("• Relación con el niño");
      if (!section2.economicSituation.trim())
        missing.push("• Situación económica actual");
      if (
        section2.parentEmail.trim() &&
        !VALIDATION_PATTERNS.EMAIL.test(section2.parentEmail)
      ) {
        missing.push("• Correo electrónico válido (si se proporciona)");
      }
      Alert.alert("Campos Obligatorios", missing.join("\n"));
      return;
    }

    handleFinalize();
  }, [currentSection, handleFinalize, section1, section2]);

  const handlePreviousSection = useCallback(() => {
    setCurrentSection((prev) => (prev > 1 ? prev - 1 : prev));
  }, []);

  return {
    currentSection,
    errors,
    handleCancelRegistration,
    handleFinalize,
    handlePreviousSection,
    isKeyboardVisible,
    isLoading,
    privacyModalVisible,
    section1,
    section2,
    section3,
    setPrivacyModalVisible,
    setTermsModalVisible,
    termsModalVisible,
    user,
    validateAndNext,
  };
};

export type UseProfileRegistrationReturn = ReturnType<
  typeof useProfileRegistration
>;
