import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { conectaStyles as styles } from "@/styles/conectaStyles";
import { WeeklyEventCard } from "@/components/events/WeeklyEventCard";
import type {
  AttendanceCoords,
  WeeklyEvent,
  WeeklyEventAttendance,
} from "@/services/events/types";

type WeeklyEventsSectionProps = {
  events: WeeklyEvent[];
  attendance: Record<string, WeeklyEventAttendance>;
  eventsLoading: boolean;
  error: string | null;
  onSubmitAttendance: (
    eventId: string,
    payload: { coords: AttendanceCoords | null; photoUri: string | null }
  ) => Promise<void> | void;
  submittingAttendance: Record<string, boolean>;
};

export const WeeklyEventsSection = ({
  attendance,
  error,
  events,
  eventsLoading,
  onSubmitAttendance,
  submittingAttendance,
}: WeeklyEventsSectionProps) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Eventos semanales gratuitos</Text>
    </View>
    <Text style={styles.sectionDescription}>
      Participa en las actividades de la semana. Sube una foto, comparte tu
      ubicación y reporta que asististe.
    </Text>

    {eventsLoading && (
      <View style={styles.centerRow}>
        <ActivityIndicator color="#0A2240" />
        <Text style={styles.infoText}>Cargando eventos...</Text>
      </View>
    )}

    {error && <Text style={styles.errorText}>{error}</Text>}

    {!eventsLoading && !events.length && !error && (
      <Text style={styles.infoText}>No hay eventos disponibles esta semana.</Text>
    )}

    {!eventsLoading &&
      events.map((event) => (
        <WeeklyEventCard
          key={event.id}
          event={event}
          attendance={attendance[event.id]}
          onSubmit={onSubmitAttendance}
          submitting={submittingAttendance[event.id]}
        />
      ))}
  </View>
);
