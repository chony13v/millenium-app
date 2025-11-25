import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { generateUniqueNumber } from "@/utils/generateUniqueNumber";

export type Profile = {
  acuerdoPrivacidad: boolean;
  afiliacionEquipo: string;
  autorizacionFotos: boolean;
  birthDate: string;
  city?: string;
  consentimientoParticipacion: boolean;
  dateTime: string;
  edad?: number;
  email: string;
  fullName: string;
  idNumber?: string;
  imageUrl?: string;
  informacionMedica: string;
  parentEmail: string;
  parentFullName?: string;
  parentPhoneNumber: string;
  position: string;
  registrationDate: string;
  relationship: string;
  economicSituation?: string;
  uniqueNumber?: string;
};

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const userRef = doc(db, "Participantes", userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return null;
  }

  const userData = userDoc.data() as Profile;

  if (!userData.uniqueNumber) {
    const uniqueNumber = await generateUniqueNumber();
    const updatedProfile = { ...userData, uniqueNumber };
    await save(userId, updatedProfile);
    return updatedProfile;
  }

  return userData;
};

export const save = async (
  userId: string,
  data: Partial<Profile>
): Promise<void> => {
  await setDoc(doc(db, "Participantes", userId), data, { merge: true });
};

export const updateImage = async (
  userId: string,
  imageBase64: string
): Promise<Profile | null> => {
  await save(userId, { imageUrl: imageBase64 });

  const userRef = doc(db, "Participantes", userId);
  const userDoc = await getDoc(userRef);

  return userDoc.exists() ? (userDoc.data() as Profile) : null;
};