import { useEffect } from "react";

import { awardPointsEvent } from "@/services/points/awardPoints";

export function useDailyAppOpenPoints(userId?: string | null) {
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    awardPointsEvent({
      userId,
      eventType: "app_open_daily",
    }).catch((error) => {
      if (cancelled) return;
      console.warn("No se pudo otorgar puntos diarios:", error);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);
}
