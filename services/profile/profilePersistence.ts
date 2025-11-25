import { Alert } from "react-native";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";

export type ProfilePayload = {
  fullName: string;
  email: string | undefined;
  idNumber: string;
  birthDate: string;
  edad: number;
  position: string;
  city: string;
  dateTime: string;
  informacionMedica: string;
  afiliacionEquipo: string;
  parentFullName: string;
  relationship: string;
  economicSituation: string;
  parentPhoneNumber: string;
  parentEmail: string;
  consentimientoParticipacion: boolean;
  autorizacionFotos: boolean;
  acuerdoPrivacidad: boolean;
  esRiobambeno: boolean;
  registrationDate: string;
};

export const getExistingRegistration = async (userId: string) => {
  const userRef = doc(db, "Participantes", userId);
  const userDoc = await getDoc(userRef);
  return userDoc.exists();
};

export const saveProfile = async (userId: string, payload: ProfilePayload) => {
  const userRef = doc(db, "Participantes", userId);
  await setDoc(userRef, payload);
};

export const showExistingRegistrationAlert = (onConfirm: () => void) => {
  Alert.alert(
    "Registro Existente",
    "Ya te encuentras registrado para el torneo selectivo.",
    [{ text: "Entendido", onPress: onConfirm }]
  );
};

export const showTutorReminderAlert = () => {
  Alert.alert(
    "Aviso Importante",
    "Este formulario debe ser completado por el tutor legal del aspirante.",
    [{ text: "Entendido" }]
  );
};