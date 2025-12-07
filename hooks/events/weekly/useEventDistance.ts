import { useCallback, useMemo } from "react";

import type { AttendanceCoords, WeeklyEvent } from "@/services/events/types";
import { isWithinRadius } from "@/utils/events";

export type EventDistanceResult = {
  distanceMeters: number | null;
  isInside: boolean;
  radiusMeters: number | null;
};

export const useEventDistance = (events: WeeklyEvent[]) => {
  const eventsById = useMemo(() => {
    const map = new Map<string, WeeklyEvent>();
    events.forEach((event) => map.set(event.id, event));
    return map;
  }, [events]);

  const validateEventDistance = useCallback(
    (eventId: string, coords: AttendanceCoords | null): EventDistanceResult => {
      const targetEvent = eventsById.get(eventId);
      const result = isWithinRadius(
        targetEvent?.locationCenter ?? null,
        targetEvent?.radiusMeters ?? null,
        coords
      );

      return {
        distanceMeters: result.distanceMeters,
        isInside: result.isInside,
        radiusMeters: result.radiusMeters,
      };
    },
    [eventsById]
  );

  const getEvent = useCallback(
    (eventId: string) => eventsById.get(eventId) ?? null,
    [eventsById]
  );

  return { getEvent, validateEventDistance };
};