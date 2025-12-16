import { useEffect, useRef } from "react";

import { Stack } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import * as SplashScreen from "expo-splash-screen";

import { CitySelectionProvider } from "@/hooks/useCitySelection";
import { useDailyAppOpenPoints } from "@/hooks/useDailyAppOpenPoints";
import { usePushTokenSync } from "@/hooks/usePushTokenSync";
import { useNotificationListeners } from "@/hooks/usePushNotifications";
import { linkClerkSessionToFirebase } from "@/services/auth/firebaseAuth";
import { useFirebaseUid } from "@/hooks/useFirebaseUid";
import { auth } from "@/config/FirebaseConfig";
import { signOut as firebaseSignOut } from "firebase/auth";

const FirebaseSync = () => {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const linkedUidRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!isSignedIn || !user) {
      linkedUidRef.current = null;
      firebaseSignOut(auth).catch(() => {});
      return;
    }

    const targetUid = user.id;
    const currentFirebaseUid = auth.currentUser?.uid ?? null;
    const alreadyLinked =
      linkedUidRef.current === targetUid && currentFirebaseUid === targetUid;

    if (alreadyLinked) return;

    linkedUidRef.current = targetUid;

    linkClerkSessionToFirebase(getToken)
      .then((currentUser) => {
        if (cancelled) return;
        linkedUidRef.current = currentUser?.uid ?? targetUid;
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("❌ Error enlazando Firebase →", err);
        linkedUidRef.current = null;
      });

    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn, user]);

  return null;
};

const HideSplashScreen = () => {
  useEffect(() => {
    SplashScreen.hideAsync().catch((error) => {
      console.warn("Error hiding splash screen:", error);
    });
  }, []);

  return null;
};

export const ClerkAppProviders = () => {
  const { user } = useUser();
  const { firebaseUid } = useFirebaseUid();
  const cityIdentityKey = firebaseUid ?? user?.id ?? null;

  useNotificationListeners();
  usePushTokenSync(firebaseUid ?? undefined);
  useDailyAppOpenPoints(firebaseUid ?? undefined);

  return (
    <>
      <HideSplashScreen />
      <FirebaseSync />
      <CitySelectionProvider identityKey={cityIdentityKey}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(call)" options={{ headerShown: false }} />
        </Stack>
      </CitySelectionProvider>
    </>
  );
};

export default ClerkAppProviders;
