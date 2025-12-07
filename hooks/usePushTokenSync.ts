import { useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";

import { db } from "@/config/FirebaseConfig";
import { registerForPushNotificationsAsync } from "@/hooks/usePushNotifications";

export function usePushTokenSync(userId?: string) {
  useEffect(() => {
    if (!userId) return;
    let syncing = false;
    let cancelled = false;

    let isActive = true;

    const syncPushToken = async () => {
      if (syncing) return;
      syncing = true;
      const token = await registerForPushNotificationsAsync();
      if (!isActive || !token) return;

      await setDoc(
        doc(db, "Participantes", userId),
        { expoPushToken: token },
        { merge: true }
      );
      console.log("✅ Push token guardado en Firestore");
    };

    syncPushToken().catch((error) => {
      console.warn("No se pudo sincronizar el token de push:", error);
    });

    return () => {
      isActive = false;
    };
  }, [userId]);
}
