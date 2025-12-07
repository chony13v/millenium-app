import { useCallback, useMemo, useState } from "react";

import type {
  WeeklyEvent,
  WeeklyEventAttendance,
} from "@/services/events/types";

export const useWeeklyEventsStore = () => {
  const [events, setEvents] = useState<WeeklyEvent[]>([]);
  const [attendance, setAttendance] = useState<
    Record<string, WeeklyEventAttendance>
  >({});
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingAttendance, setSubmittingAttendance] = useState<
    Record<string, boolean>
  >({});

  const setSubmitting = useCallback((eventId: string, value: boolean) => {
    setSubmittingAttendance((prev) => ({ ...prev, [eventId]: value }));
  }, []);

  const updateAttendance = useCallback(
    (eventId: string, data: Partial<WeeklyEventAttendance>) => {
      setAttendance((prev) => ({
        ...prev,
        [eventId]: {
          ...(prev[eventId] ?? {}),
          ...data,
        } as WeeklyEventAttendance,
      }));
    },
    []
  );

  const store = useMemo(
    () => ({
      attendance,
      error,
      events,
      eventsLoading,
      setAttendance,
      setError,
      setEvents,
      setEventsLoading,
      setSubmitting,
      setSubmittingAttendance,
      submittingAttendance,
      updateAttendance,
    }),
    [
      attendance,
      error,
      events,
      eventsLoading,
      setSubmitting,
      submittingAttendance,
      updateAttendance,
    ]
  );

  return store;
};
