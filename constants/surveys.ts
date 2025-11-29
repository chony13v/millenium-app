// constants/surveys.ts
import { db } from "@/config/FirebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";

/* Tipos */
export type Survey = {
  id: string;
  title: string;
  question: string;
  options: string[];
  cityId: string | "all";
  isActive: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

/* Utilidades internas */
const mapSurveyDoc = (snap: any): Survey | null => {
  if (!snap?.exists?.()) return null;
  const data = snap.data() as Partial<Survey>;
  return {
    id: snap.id,
    title: data.title ?? "Encuesta",
    question: data.question ?? "¿Qué opinas?",
    options: Array.isArray(data.options) ? data.options : [],
    cityId: (data.cityId as string) ?? "all",
    isActive: !!data.isActive,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
};

/**
 * Lee la encuesta activa desde Firestore:
 * 1) Intenta leer config/activeSurvey.surveyId y trae ese documento.
 * 2) Si no existe o no está activa, busca la primera encuesta activa.
 * 3) Si falla todo, devuelve null.
 */
export const fetchActiveSurveyForUser = async (): Promise<Survey | null> => {
  try {
    const cfgSnap = await getDoc(doc(db, "config", "activeSurvey"));
    const cfgSurveyId = cfgSnap.exists()
      ? (cfgSnap.data()?.surveyId as string | undefined)
      : undefined;

    if (cfgSurveyId) {
      const activeSnap = await getDoc(doc(db, "surveys", cfgSurveyId));
      const mapped = mapSurveyDoc(activeSnap);
      if (mapped && mapped.isActive) return mapped;
    }

    const activeQuery = query(
      collection(db, "surveys"),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );
    const listSnap = await getDocs(activeQuery);
    const firstActive = listSnap.docs.map(mapSurveyDoc).find(Boolean);
    if (firstActive) return firstActive as Survey;

    return null;
  } catch (error) {
    console.warn("No se pudo obtener encuesta activa:", error);
    return null;
  }
};

/**
 * Marca en el perfil de puntos qué encuesta se votó por última vez.
 * Úsalo después de registrar el poll_vote en el ledger.
 */
export const updateLastSurveyVoted = async (
  userId: string,
  surveyId: string
) => {
  const profileRef = doc(db, "users", userId, "points_profile", "profile");
  await import("firebase/firestore").then(({ setDoc }) =>
    setDoc(
      profileRef,
      {
        lastSurveyIdVoted: surveyId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  );
};

/**
 * Determina si la encuesta activa está disponible para el usuario,
 * comparando el surveyId activo con el guardado en el perfil (lastSurveyIdVoted).
 */
export const isSurveyAvailable = (
  activeSurveyId: string | null | undefined,
  lastSurveyIdVoted?: string | null
) => {
  if (!activeSurveyId) return false;
  return activeSurveyId !== lastSurveyIdVoted;
};
