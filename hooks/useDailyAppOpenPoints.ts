import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { awardPointsEvent } from "@/services/points/awardPoints";
import { auth } from "@/config/FirebaseConfig";

export function useDailyAppOpenPoints(userId?: string | null) {
  const firedDayRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const triggerAward = async () => {
      const todayKey = new Date().toISOString().slice(0, 10);
      if (firedDayRef.current === todayKey) return;
      if (!auth.currentUser || auth.currentUser.uid !== userId) return;

      firedDayRef.current = todayKey;
      try {
        await awardPointsEvent({
          userId,
          eventType: "app_open_daily",
        });
      } catch (error) {
        console.warn("No se pudo otorgar puntos diarios:", error);
        firedDayRef.current = null; // permitir retry en siguiente auth cambio
      }
    };

    // Intento inmediato si ya hay sesión
    void triggerAward();

    const unsub = onAuthStateChanged(auth, () => {
      void triggerAward();
    });

    return () => {
      unsub();
    };
  }, [userId]);
}
