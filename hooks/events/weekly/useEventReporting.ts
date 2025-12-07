import { useCallback } from "react";
import { Alert } from "react-native";

import type { CityId } from "@/constants/cities";
import type { FirebaseStorage } from "firebase/storage";
import type {
  AttendanceCoords,
  WeeklyEvent,
  WeeklyEventAttendance,
} from "@/services/events/types";
import type { EventsService } from "./eventsService";
import type { EventDistanceResult } from "./useEventDistance";

const toKm = (meters: number) => (meters / 1000).toFixed(1);

export type UseEventReportingParams = {
  attendance: Record<string, WeeklyEventAttendance>;
  ensureFirebaseSession: () => Promise<boolean>;
  selectedCity: CityId | null;
  services: EventsService;
  storage: FirebaseStorage;
  updateAttendance: (
    eventId: string,
    data: Partial<WeeklyEventAttendance>
  ) => void;
  setSubmitting: (eventId: string, submitting: boolean) => void;
  submittingAttendance: Record<string, boolean>;
  userId?: string;
  validateDistance: (
    eventId: string,
    coords: AttendanceCoords | null
  ) => EventDistanceResult;
  getEvent: (eventId: string) => WeeklyEvent | null;
};

export const useEventReporting = ({
  attendance,
  ensureFirebaseSession,
  getEvent,
  selectedCity,
  services,
  storage,
  submittingAttendance,
  setSubmitting,
  updateAttendance,
  userId,
  validateDistance,
}: UseEventReportingParams) => {
  const notifyOutsideRange = useCallback((radiusMeters: number) => {
    Alert.alert(
      "No te encuentras dentro del rango permitido para este evento.",
      `Debes estar dentro de ${toKm(
        radiusMeters
      )} km para registrar asistencia.`
    );
  }, []);

  const verifyWithRelink = useCallback(
    async (
      attendanceId: string,
      coords: AttendanceCoords,
      eventId: string,
      userId: string
    ) => {
      try {
        return await services.verifyAttendance({
          attendanceId,
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
            return await services.verifyAttendance({
              attendanceId,
              coords,
              eventId,
              userId,
            });
          }
        }

        throw verificationError;
      }
    },
    [ensureFirebaseSession, services]
  );

  const handleRegisterAttendance = useCallback(
    async (
      eventId: string,
      payload: { coords: AttendanceCoords | null; photoUri: string | null }
    ) => {
      if (submittingAttendance[eventId]) return;

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

      const targetEvent = getEvent(eventId);
      if (targetEvent && targetEvent.active === false) {
        Alert.alert(
          "Evento inactivo",
          "Este evento ya no está disponible para registrar asistencia."
        );
        return;
      }

      const { distanceMeters, isInside, radiusMeters } = validateDistance(
        eventId,
        coords
      );

      if (radiusMeters && distanceMeters && !isInside) {
        notifyOutsideRange(radiusMeters);
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
        const alreadyReported = await services.hasReport(eventId, userId);
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

      setSubmitting(eventId, true);

      try {
        const currentAttendance = attendance[eventId];
        let photoUrl = currentAttendance?.photoUrl ?? null;

        if (payload.photoUri) {
          const uploadedUrl = await services.uploadPhoto({
            eventId,
            photoUri: payload.photoUri,
            storage,
            userId,
          });

          if (uploadedUrl) {
            photoUrl = uploadedUrl;
          }
        }

        const savedId = await services.saveAttendance({
          cityId: selectedCity,
          coords,
          eventId,
          existingAttendanceId: currentAttendance?.id,
          photoUrl,
          pointsStatus: "pending",
          userId,
        });

        updateAttendance(eventId, {
          id: savedId,
          eventId,
          userId,
          cityId: selectedCity,
          coords,
          photoUrl,
          attendedAt: new Date(),
          pointsStatus: "pending",
        });

        try {
          const verification = await verifyWithRelink(
            savedId,
            coords,
            eventId,
            userId
          );

          const pointsStatus = verification.verified ? "awarded" : "failed";

          await services.saveAttendance({
            cityId: selectedCity,
            coords,
            eventId,
            existingAttendanceId: savedId,
            photoUrl,
            pointsStatus,
            userId,
          });

          updateAttendance(eventId, {
            ...(attendance[eventId] ?? {}),
            pointsStatus,
          });

          if (verification.verified) {
            services
              .markReported({
                attendanceId: savedId,
                eventId,
                pointsAdded: verification.pointsAdded,
                userId,
              })
              .catch((eventReportError) =>
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
              const fallbackVerification =
                await services.verifyAttendanceFallback({
                  attendanceId: savedId,
                  cityId: selectedCity,
                  coords,
                  distanceMeters: distanceMeters ?? 0,
                  eventId,
                  userId,
                });

              updateAttendance(eventId, {
                ...(attendance[eventId] ?? {}),
                pointsStatus: fallbackVerification.verified
                  ? "awarded"
                  : "failed",
              });

              if (fallbackVerification.verified) {
                services
                  .markReported({
                    attendanceId: savedId,
                    eventId,
                    pointsAdded: fallbackVerification.pointsAdded,
                    userId,
                  })
                  .catch((eventReportError) =>
                    console.warn(
                      "No se pudo registrar el bloqueo del evento (fallback)",
                      eventReportError
                    )
                  );
              }

              Alert.alert(
                fallbackVerification.verified
                  ? "Puntos asignados"
                  : "No válido",
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
        setSubmitting(eventId, false);
      }
    },
    [
      attendance,
      ensureFirebaseSession,
      getEvent,
      notifyOutsideRange,
      selectedCity,
      services,
      storage,
      submittingAttendance,
      updateAttendance,
      userId,
      validateDistance,
      verifyWithRelink,
    ]
  );

  return { handleRegisterAttendance };
};
