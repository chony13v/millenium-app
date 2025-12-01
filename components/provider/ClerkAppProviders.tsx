import { useEffect } from "react";

import { Stack } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import * as SplashScreen from "expo-splash-screen";

import { CitySelectionProvider } from "@/hooks/useCitySelection";
import { useDailyAppOpenPoints } from "@/hooks/useDailyAppOpenPoints";
import { usePushTokenSync } from "@/hooks/usePushTokenSync";
import { useNotificationListeners } from "@/hooks/usePushNotifications";
import { linkClerkSessionToFirebase } from "@/services/auth/firebaseAuth";

const FirebaseSync = () => {
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    linkClerkSessionToFirebase(getToken).catch((err) => {
      console.error("❌ Error enlazando Firebase →", err);
    });
  }, [isSignedIn, getToken]);

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

  useNotificationListeners();
  usePushTokenSync(user?.id);
  useDailyAppOpenPoints(user?.id);

  return (
    <>
      <HideSplashScreen />
      <FirebaseSync />
      <CitySelectionProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(call)" options={{ headerShown: false }} />
        </Stack>
      </CitySelectionProvider>
    </>
  );
};

export default ClerkAppProviders;
