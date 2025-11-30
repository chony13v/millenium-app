import { useEffect } from "react";

import { awardPointsEvent } from "@/services/points/awardPoints";

export function useDailyAppOpenPoints(userId?: string) {
  useEffect(() => {
    if (!userId) return;

    awardPointsEvent({
      userId,
      eventType: "app_open_daily",
    }).catch((error) => {
      console.warn("No se pudo otorgar puntos diarios:", error);
    });
  }, [userId]);
}