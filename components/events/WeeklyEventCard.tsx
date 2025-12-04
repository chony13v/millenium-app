import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { conectaStyles as styles } from "@/styles/conectaStyles";
import { useEventAttendanceForm } from "@/hooks/events/useEventAttendanceForm";
import type {
  AttendanceCoords,
  WeeklyEvent,
  WeeklyEventAttendance,
} from "@/services/events/types";

type WeeklyEventCardProps = {
  event: WeeklyEvent;
  attendance?: WeeklyEventAttendance;
  onSubmit: (
    eventId: string,
    payload: { coords: AttendanceCoords | null; photoUri: string | null }
  ) => Promise<void> | void;
  submitting?: boolean;
};

export const WeeklyEventCard = ({
  event,
  attendance,
  onSubmit,
  submitting = false,
}: WeeklyEventCardProps) => {
  const {
    coords,
    locationLoading,
    photoUri,
    pickPhoto,
    requestCoords,
    setPhotoUri,
  } = useEventAttendanceForm({
    initialCoords: attendance?.coords ?? null,
  });

  const coordsToDisplay = coords ?? attendance?.coords ?? null;
  const photoPreview = photoUri ?? attendance?.photoUrl ?? null;
  const hasAttendance = !!attendance;
  const isAwarded = attendance?.pointsStatus === "awarded";

  const handleSubmit = async () => {
    if (isAwarded) {
      Alert.alert(
        "Ya reportaste tu asistencia a este evento",
        "Solo puedes enviar un reporte por evento."
      );
      return;
    }

    const resolvedCoords = coords ?? attendance?.coords ?? null;
    if (!resolvedCoords) {
      Alert.alert(
        "Ubicación requerida",
        "Comparte tu ubicación antes de registrar asistencia."
      );
      return;
    }

    await onSubmit(event.id, {
      coords: resolvedCoords,
      photoUri,
    });

    setPhotoUri(null);
  };

  return (
    <View style={styles.surveyCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.surveyTitle}>{event.title}</Text>
        <Text style={[styles.sectionPill, styles.sectionPillAlt]}>
          {event.weekRange ?? "Semanal"}
        </Text>
      </View>

      <Text style={styles.sectionDescription}>{event.description}</Text>
      <Text style={styles.hintText}>
        Sube una foto y comparte tu ubicación para validar la asistencia.
      </Text>

      {hasAttendance && (
        <Text style={styles.answerSaved}>Asistencia registrada</Text>
      )}

      <View style={styles.locationRow}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (locationLoading || submitting) && styles.buttonDisabled,
          ]}
          onPress={requestCoords}
          disabled={locationLoading || submitting}
        >
          {locationLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryButtonText}>Compartir ubicación</Text>
          )}
        </TouchableOpacity>
        <View style={styles.coordsBadge}>
          <Text style={styles.coordsText}>
            {coordsToDisplay
              ? `${coordsToDisplay.latitude.toFixed(
                  4
                )}, ${coordsToDisplay.longitude.toFixed(4)}`
              : "Sin coordenadas"}
          </Text>
        </View>
      </View>

      <View style={styles.photoRow}>
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            submitting && styles.buttonDisabled,
          ]}
          onPress={pickPhoto}
          disabled={submitting}
        >
          <Text style={styles.secondaryButtonText}>Subir foto (opcional)</Text>
        </TouchableOpacity>
        {photoPreview && (
          <Image source={{ uri: photoPreview }} style={styles.photoPreview} />
        )}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting
            ? "Guardando..."
            : isAwarded
            ? "Ya reportaste"
            : hasAttendance
            ? "Actualizar asistencia"
            : "Reportar asistencia"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
