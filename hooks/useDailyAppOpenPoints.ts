import { useEffect } from "react";

import { awardPointsEvent } from "@/services/points/awardPoints";
import { auth } from "@/config/FirebaseConfig";

export function useDailyAppOpenPoints(userId?: string | null) {
  useEffect(() => {
    if (!userId) return;
    // No disparamos si Firebase aún no tiene sesión o si el UID no coincide
    if (!auth.currentUser || auth.currentUser.uid !== userId) return;

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
