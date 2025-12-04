import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import type { FirebaseStorage } from "firebase/storage";

import type { CityId } from "@/constants/cities";
import { fetchWeeklyAttendance } from "@/services/events/fetchWeeklyAttendance";
import { fetchWeeklyEvents } from "@/services/events/fetchWeeklyEvents";
import { saveWeeklyAttendance } from "@/services/events/saveWeeklyAttendance";
import { uploadEventPhoto } from "@/services/events/uploadEventPhoto";
import { verifyWeeklyAttendanceFallback } from "@/services/events/verifyWeeklyAttendanceFallback";
import { verifyWeeklyEventAttendance } from "@/services/events/verifyWeeklyEventAttendance";
import {
  hasEventReport,
  markEventReported,
} from "@/services/events/eventReports";
import { linkClerkSessionToFirebase } from "@/services/auth/firebaseAuth";
import type {
  AttendanceCoords,
  WeeklyEvent,
  WeeklyEventAttendance,
} from "@/services/events/types";

type UseWeeklyEventsParams = {
  hasHydrated: boolean;
  selectedCity: CityId | null;
  storage: FirebaseStorage;
  userId?: string;
};

type SubmitAttendancePayload = {
  coords: AttendanceCoords | null;
  photoUri: string | null;
};

const haversineDistanceMeters = (
  from: AttendanceCoords,
  to: AttendanceCoords
) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useWeeklyEvents = ({
  hasHydrated,
  selectedCity,
  storage,
  userId,
}: UseWeeklyEventsParams) => {
  const { getToken, isSignedIn } = useAuth();
  const [events, setEvents] = useState<WeeklyEvent[]>([]);
  const [attendance, setAttendance] = useState<
    Record<string, WeeklyEventAttendance>
  >({});
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingAttendance, setSubmittingAttendance] = useState<
    Record<string, boolean>
  >({});

  const loadEvents = useCallback(async () => {
    if (!hasHydrated) return;

    setEventsLoading(true);
    setError(null);

    try {
      const list = await fetchWeeklyEvents({ selectedCity });
      setEvents(list);
    } catch (err) {
      console.error("Error cargando eventos semanales", err);
      setError("No pudimos cargar los eventos ahora.");
    } finally {
      setEventsLoading(false);
    }
  }, [hasHydrated, selectedCity]);

  const loadAttendance = useCallback(async () => {
    if (!userId) return;

    try {
      const records = await fetchWeeklyAttendance(userId);
      setAttendance(records);
    } catch (err) {
      console.error("Error cargando asistencias a eventos", err);
    }
  }, [userId]);

  const ensureFirebaseSession = useCallback(async () => {
    if (!isSignedIn) return false;

    try {
      await linkClerkSessionToFirebase(getToken);
      return true;
    } catch (error) {
      console.warn(
        "No se pudo enlazar la sesión con Firebase para eventos semanales",
        error
      );
      return false;
    }
  }, [getToken, isSignedIn]);

  const handleRegisterAttendance = useCallback(
    async (eventId: string, payload: SubmitAttendancePayload) => {
      if (!userId) {
        Alert.alert(
          "Inicia sesión",
          "Necesitas una sesión activa para registrar asistencia."
        );
        return;
      }

      if (!selectedCity) {
        Alert.alert(
          "Selecciona un proyecto",
          "Elige una ciudad para reportar asistencia."
        );
        return;
      }

      const coords = payload.coords;
      if (!coords) {
        Alert.alert(
          "Ubicación requerida",
          "Comparte tu ubicación para registrar la asistencia."
        );
        return;
      }

      const targetEvent = events.find((evt) => evt.id === eventId);
      let distanceMeters: number | null = null;

      if (targetEvent?.locationCenter && targetEvent?.radiusMeters) {
        distanceMeters = haversineDistanceMeters(
          {
            latitude: payload.coords?.latitude ?? 0,
            longitude: payload.coords?.longitude ?? 0,
          },
          {
            latitude: targetEvent.locationCenter.latitude,
            longitude: targetEvent.locationCenter.longitude,
          }
        );

        if (distanceMeters > targetEvent.radiusMeters) {
          Alert.alert(
            "No te encuentras dentro del rango permitido para este evento.",
            `Debes estar dentro de ${(targetEvent.radiusMeters / 1000).toFixed(
              1
            )} km para registrar asistencia.`
          );
          return;
        }
      }
      if (targetEvent && targetEvent.active === false) {
        Alert.alert(
          "Evento inactivo",
          "Este evento ya no está disponible para registrar asistencia."
        );
        return;
      }

      const hasFirebaseSession = await ensureFirebaseSession();
      if (!hasFirebaseSession) {
        Alert.alert(
          "No se pudo validar",
          "No logramos enlazar tu sesión con Firebase para validar los puntos. Intenta cerrar sesión y reintentar."
        );
        return;
      }

      try {
        const alreadyReported = await hasEventReport(eventId, userId);
        if (alreadyReported) {
          Alert.alert(
            "Ya reportaste tu asistencia a este evento",
            "Solo puedes reportar una vez por evento."
          );
          return;
        }
      } catch (reportCheckError) {
        console.warn(
          "No se pudo validar reportes previos de este evento",
          reportCheckError
        );
      }

      setSubmittingAttendance((prev) => ({ ...prev, [eventId]: true }));

      try {
        const currentAttendance = attendance[eventId];
        let photoUrl = currentAttendance?.photoUrl ?? null;

        if (payload.photoUri) {
          const uploadedUrl = await uploadEventPhoto({
            eventId,
            photoUri: payload.photoUri,
            storage,
            userId,
          });

          if (uploadedUrl) {
            photoUrl = uploadedUrl;
          }
        }

        const savedId = await saveWeeklyAttendance({
          cityId: selectedCity,
          coords,
          eventId,
          existingAttendanceId: currentAttendance?.id,
          photoUrl,
          pointsStatus: "pending",
          userId,
        });

        setAttendance((prev) => ({
          ...prev,
          [eventId]: {
            id: savedId,
            eventId,
            userId,
            cityId: selectedCity,
            coords,
            photoUrl,
            attendedAt: new Date(),
            pointsStatus: "pending",
          },
        }));

        try {
          const verification = await (async () => {
            try {
              return await verifyWeeklyEventAttendance({
                attendanceId: savedId,
                coords,
                eventId,
                userId,
              });
            } catch (verificationError) {
              const errorCode =
                (verificationError as { code?: string }).code ?? "unknown";

              if (
                errorCode === "functions/unauthenticated" ||
                errorCode === "functions/permission-denied" ||
                errorCode === "unauthenticated" ||
                errorCode === "permission-denied"
              ) {
                const relinked = await ensureFirebaseSession();
                if (relinked) {
                  return await verifyWeeklyEventAttendance({
                    attendanceId: savedId,
                    coords,
                    eventId,
                    userId,
                  });
                }
              }

              throw verificationError;
            }
          })();

          const pointsStatus = verification.verified ? "awarded" : "failed";

          await saveWeeklyAttendance({
            cityId: selectedCity,
            coords,
            eventId,
            existingAttendanceId: savedId,
            photoUrl,
            pointsStatus,
            userId,
          });

          setAttendance((prev) => ({
            ...prev,
            [eventId]: {
              ...(prev[eventId] ?? {}),
              pointsStatus,
            },
          }));

          if (verification.verified) {
            markEventReported({
              attendanceId: savedId,
              eventId,
              pointsAdded: verification.pointsAdded,
              userId,
            }).catch((eventReportError) =>
              console.warn(
                "No se pudo registrar el bloqueo del evento",
                eventReportError
              )
            );
          }

          Alert.alert(
            verification.verified ? "Puntos asignados" : "No válido",
            verification.verified
              ? `Asistencia verificada. Sumaste ${verification.pointsAdded} pts.`
              : `No pudimos verificar tu ubicación. Distancia: ${Math.round(
                  verification.distanceMeters
                )} m.`
          );
        } catch (verificationError) {
          const errorCode =
            (verificationError as { code?: string }).code ?? "unknown";

          if (errorCode === "functions/not-found") {
            try {
              const fallbackVerification = await verifyWeeklyAttendanceFallback({
                attendanceId: savedId,
                cityId: selectedCity,
                coords,
                distanceMeters: distanceMeters ?? 0,
                eventId,
                userId,
              });

              setAttendance((prev) => ({
                ...prev,
                [eventId]: {
                  ...(prev[eventId] ?? {}),
                  pointsStatus: fallbackVerification.verified
                    ? "awarded"
                    : "failed",
                },
              }));

              if (fallbackVerification.verified) {
                markEventReported({
                  attendanceId: savedId,
                  eventId,
                  pointsAdded: fallbackVerification.pointsAdded,
                  userId,
                }).catch((eventReportError) =>
                  console.warn(
                    "No se pudo registrar el bloqueo del evento (fallback)",
                    eventReportError
                  )
                );
              }

              Alert.alert(
                fallbackVerification.verified ? "Puntos asignados" : "No válido",
                fallbackVerification.verified
                  ? `Asistencia validada. Sumaste ${fallbackVerification.pointsAdded} pts.`
                  : "No pudimos validar los puntos en este momento."
              );
              return;
            } catch (fallbackError) {
              console.warn(
                "Error en verificación local de evento semanal",
                fallbackError
              );
            }
          } else {
            console.warn(
              "Error verificando asistencia de evento",
              verificationError
            );
          }

          Alert.alert(
            "Guardado como pendiente",
            "Registramos tu asistencia pero no pudimos validar los puntos ahora."
          );
        }
      } catch (err) {
        console.error("Error registrando asistencia a evento", err);
        Alert.alert(
          "No pudimos guardar",
          "Intenta nuevamente en unos segundos."
        );
      } finally {
        setSubmittingAttendance((prev) => ({ ...prev, [eventId]: false }));
      }
    },
    [attendance, ensureFirebaseSession, events, selectedCity, storage, userId]
  );

  useEffect(() => {
    if (!userId) {
      setAttendance({});
    }
  }, [userId]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  return {
    attendance,
    events,
    eventsLoading,
    error,
    handleRegisterAttendance,
    reloadEvents: loadEvents,
    reloadAttendance: loadAttendance,
    submittingAttendance,
  };
};
