import { useCallback, useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import type { FirebaseStorage } from "firebase/storage";

import type { CityId } from "@/constants/cities";
import { linkClerkSessionToFirebase } from "@/services/auth/firebaseAuth";
import type { WeeklyEventAttendance } from "@/services/events/types";
import { createEventsService } from "./weekly/eventsService";
import { useEventDistance } from "./weekly/useEventDistance";
import { useEventReporting } from "./weekly/useEventReporting";
import { useWeeklyEventsStore } from "./weekly/useWeeklyEventsStore";

export type UseWeeklyEventsParams = {
  hasHydrated: boolean;
  selectedCity: CityId | null;
  storage: FirebaseStorage;
  userId?: string;
};

export type SubmitAttendancePayload = {
  coords: WeeklyEventAttendance["coords"];
  photoUri: string | null;
};

const eventsService = createEventsService();

export const useWeeklyEvents = ({
  hasHydrated,
  selectedCity,
  storage,
  userId,
}: UseWeeklyEventsParams) => {
  const { getToken, isSignedIn } = useAuth();
  const {
    attendance,
    error,
    events,
    eventsLoading,
    setAttendance,
    setError,
    setEvents,
    setEventsLoading,
    setSubmitting,
    submittingAttendance,
    updateAttendance,
  } = useWeeklyEventsStore();

  const { getEvent, validateEventDistance } = useEventDistance(events);

  const ensureFirebaseSession = useCallback(async () => {
    if (!isSignedIn) return false;

    try {
      await linkClerkSessionToFirebase(getToken);
      return true;
    } catch (firebaseError) {
      console.warn(
        "No se pudo enlazar la sesión con Firebase para eventos semanales",
        firebaseError
      );
      return false;
    }
  }, [getToken, isSignedIn]);

  const loadEvents = useCallback(async () => {
    if (!hasHydrated) return;

    setEventsLoading(true);
    setError(null);

    try {
      const list = await eventsService.fetchEvents({ selectedCity });
      setEvents(list);
    } catch (err) {
      console.error("Error cargando eventos semanales", err);
      setError("No pudimos cargar los eventos ahora.");
    } finally {
      setEventsLoading(false);
    }
  }, [hasHydrated, selectedCity, setError, setEvents, setEventsLoading]);

  const loadAttendance = useCallback(async () => {
    if (!userId) return;

    try {
      const records = await eventsService.fetchAttendance(userId);
      setAttendance(records);
    } catch (err) {
      console.error("Error cargando asistencias a eventos", err);
    }
  }, [setAttendance, userId]);

  const { handleRegisterAttendance } = useEventReporting({
    // @migration: flow de reporte extraído a sub-hook
    attendance,
    ensureFirebaseSession,
    getEvent,
    selectedCity,
    services: eventsService,
    storage,
    submittingAttendance,
    setSubmitting,
    updateAttendance,
    userId,
    validateDistance: validateEventDistance,
  });

  useEffect(() => {
    if (!userId) {
      setAttendance({});
    }
  }, [setAttendance, userId]);

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
