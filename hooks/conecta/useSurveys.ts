import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import type * as Location from "expo-location";

import { db } from "@/config/FirebaseConfig";
import type { CityId } from "@/constants/cities";
import { awardPointsEvent } from "@/services/points/awardPoints";
import { updateUserLocationBucket } from "@/services/location/updateUserLocationBucket";

export type Survey = {
  id: string;
  title: string;
  question: string;
  options: string[];
  cityId?: CityId | "all";
};

interface UseSurveysParams {
  hasHydrated: boolean;
  selectedCity: CityId | null;
  userEmail?: string | null;
  userId?: string;
}

export const useSurveys = ({
  hasHydrated,
  selectedCity,
  userEmail,
  userId,
}: UseSurveysParams) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<Record<string, string>>({});
  const [surveysLoading, setSurveysLoading] = useState(false);
  const [surveyError, setSurveyError] = useState<string | null>(null);
  const [sendingSurvey, setSendingSurvey] = useState<Record<string, boolean>>({});
  const [knownSurveyLocation, setKnownSurveyLocation] =
    useState<Location.LocationObjectCoords | null>(null);

  const fetchSurveys = useCallback(async () => {
    if (!hasHydrated) return;

    setSurveysLoading(true);
    setSurveyError(null);

    try {
      const q = query(collection(db, "surveys"), where("isActive", "==", true));
      const snapshot = await getDocs(q);
      const list: Survey[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Partial<Survey>;
        const targetCity = data.cityId as CityId | "all" | undefined;

        if (
          !selectedCity ||
          !targetCity ||
          targetCity === selectedCity ||
          targetCity === "all"
        ) {
          list.push({
            id: docSnap.id,
            title: data.title ?? "Encuesta",
            question: data.question ?? "¿Qué opinas?",
            options: Array.isArray(data.options) ? data.options : [],
            cityId: data.cityId,
          });
        }
      });

      setSurveys(list);
    } catch (error) {
      console.error("Error cargando encuestas", error);
      setSurveyError("No pudimos cargar las encuestas ahora.");
    } finally {
      setSurveysLoading(false);
    }
  }, [hasHydrated, selectedCity]);

  const fetchUserResponses = useCallback(async () => {
    if (!userId) return;

    try {
      const q = query(
        collection(db, "surveyResponses"),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);
      const responses: Record<string, string> = {};

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as { surveyId?: string; answer?: string };
        if (data.surveyId && data.answer) {
          responses[data.surveyId] = data.answer;
        }
      });

      setSurveyResponses(responses);
    } catch (error) {
      console.error("Error cargando respuestas", error);
    }
  }, [userId]);

  const ensureSurveyLocation = useCallback(async () => {
    if (!userId) return null;
    if (knownSurveyLocation) return knownSurveyLocation;

    return await new Promise<Location.LocationObjectCoords | null>((resolve) => {
      Alert.alert(
        "¿Compartes tu ubicación?",
        "Ayúdanos a priorizar mejoras en los barrios compartiendo tu ubicación aproximada.",
        [
          {
            text: "Ahora no",
            style: "cancel",
            onPress: () => resolve(null),
          },
          {
            text: "Sí, compartir",
            onPress: async () => {
              try {
                const result = await updateUserLocationBucket({
                  userId,
                  userEmail,
                  cityId: selectedCity ?? null,
                });
                setKnownSurveyLocation(result.coords);
                resolve(result.coords);
              } catch (err) {
                console.warn("No se pudo obtener ubicación para encuesta:", err);
                Alert.alert(
                  "Ubicación no disponible",
                  "No pudimos obtener tu ubicación. Puedes intentar nuevamente desde Canchas."
                );
                resolve(null);
              }
            },
          },
        ]
      );
    });
  }, [knownSurveyLocation, selectedCity, userEmail, userId]);

  const ensurePollVoteAwarded = useCallback(
    async (surveyId: string, answer: string) => {
      if (!userId) return;

      try {
        const ledgerQuery = query(
          collection(db, "users", userId, "points_ledger"),
          where("eventType", "==", "poll_vote"),
          where("metadata.surveyId", "==", surveyId),
          limit(1)
        );

        const ledgerSnap = await getDocs(ledgerQuery);
        if (!ledgerSnap.empty) {
          return; // ya registrado
        }

        const metadata: Record<string, unknown> = { surveyId, answer };
        if (knownSurveyLocation) {
          metadata.location = {
            latitude: knownSurveyLocation.latitude,
            longitude: knownSurveyLocation.longitude,
          };
        }

        await awardPointsEvent({
          userId,
          eventType: "poll_vote",
          metadata,
        });
      } catch (pointsError) {
        console.warn(
          "No se pudieron otorgar puntos por la encuesta:",
          pointsError
        );
      }
    },
    [knownSurveyLocation, userId]
  );

  const handleAnswerSurvey = useCallback(
    async (surveyId: string, answer: string) => {
      if (!userId) {
        Alert.alert(
          "Inicia sesión",
          "Necesitas una sesión activa para responder."
        );
        return;
      }

      if (!selectedCity) {
        Alert.alert(
          "Selecciona un proyecto",
          "Debes elegir una ciudad antes de responder."
        );
        return;
      }

      const surveyLocation = await ensureSurveyLocation();

      if (surveyResponses[surveyId]) {
        await ensurePollVoteAwarded(surveyId, surveyResponses[surveyId]);
        Alert.alert("Gracias", "Ya registramos tu respuesta para esta encuesta.");
        return;
      }

      setSendingSurvey((prev) => ({ ...prev, [surveyId]: true }));

      try {
        await addDoc(collection(db, "surveyResponses"), {
          surveyId,
          answer,
          userId,
          cityId: selectedCity,
          ...(surveyLocation
            ? {
                coords: {
                  latitude: surveyLocation.latitude,
                  longitude: surveyLocation.longitude,
                },
              }
            : {}),
          createdAt: serverTimestamp(),
        });

        setSurveyResponses((prev) => ({ ...prev, [surveyId]: answer }));

        await ensurePollVoteAwarded(surveyId, answer);

        Alert.alert("Respuesta enviada", "Gracias por participar.");
      } catch (error) {
        console.error("Error guardando respuesta", error);
        Alert.alert(
          "No pudimos guardar",
          "Intenta nuevamente en unos segundos."
        );
      } finally {
        setSendingSurvey((prev) => ({ ...prev, [surveyId]: false }));
      }
    },
    [
      ensurePollVoteAwarded,
      ensureSurveyLocation,
      surveyResponses,
      selectedCity,
      userId,
    ]
  );

  useEffect(() => {
    void fetchSurveys();
  }, [fetchSurveys]);

  useEffect(() => {
    void fetchUserResponses();
  }, [fetchUserResponses]);

  useEffect(() => {
    if (!userId) return;
    const awardExisting = async () => {
      const entries = Object.entries(surveyResponses);
      for (const [surveyId, answer] of entries) {
        await ensurePollVoteAwarded(surveyId, answer);
      }
    };
    void awardExisting();
  }, [surveyResponses, ensurePollVoteAwarded, userId]);

  return {
    surveys,
    surveyResponses,
    surveysLoading,
    surveyError,
    sendingSurvey,
    handleAnswerSurvey,
  };
};