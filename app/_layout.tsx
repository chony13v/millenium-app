import "react-native-gesture-handler";

import {
  ClerkProvider,
  ClerkLoaded,
  useAuth,
  useUser,
} from "@clerk/clerk-expo";

import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useCallback } from "react";
import LoadingBall from "@/components/LoadingBall";
import { CitySelectionProvider } from "@/hooks/useCitySelection";
import {
  registerForPushNotificationsAsync,
  useNotificationListeners,
} from "@/hooks/usePushNotifications";
import { db } from "@/config/FirebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { localization, publishableKey, tokenCache } from "@/config/ClerkConfig";

SplashScreen.preventAutoHideAsync();

/* ------------------------------------------------------------------ */
/* Enlaza la sesión de Clerk con Firebase Auth una sola vez por login */
/* ------------------------------------------------------------------ */
const FirebaseSync = () => {
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    const link = async () => {
      if (!isSignedIn) return;

      try {
        const token = await getToken({ template: "integration_firebase" });
        if (!token) {
          console.log("⚠️ Clerk no devolvió token para Firebase");
          return;
        }

        const auth = getAuth();
        if (!auth.currentUser) {
          await signInWithCustomToken(auth, token);
          console.log("✅ Sesión Firebase enlazada con Clerk");
        }
      } catch (err) {
        console.error("❌ Error enlazando Firebase →", err);
      }
    };

    link();
  }, [isSignedIn, getToken]);

  return null;
};

/* ------------------------------------------------------------------ */
/* Componente seguro para usar `useUser()` dentro del contexto Clerk  */
/* ------------------------------------------------------------------ */

const HideSplashScreen = () => {
  useEffect(() => {
    SplashScreen.hideAsync().catch((error) => {
      console.warn("Error hiding splash screen:", error);
    });
  }, []);

  return null;
};

const AfterClerkLoaded = () => {
  const { user } = useUser();

  useNotificationListeners();

  useEffect(() => {
    async function setupPush() {
      const token = await registerForPushNotificationsAsync();
      if (token && user?.id) {
        await setDoc(
          doc(db, "Participantes", user.id),
          { expoPushToken: token },
          { merge: true }
        );
        console.log("✅ Push token guardado en Firestore");
      }
    }

    if (user?.id) {
      setupPush();
    }
  }, [user?.id]);

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

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
      } catch (e) {
        console.warn("Error preparing app:", e);
      } finally {
        setAppIsReady(true);
        setIsLoading(false);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!publishableKey) {
    throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env");
  }

  if (!appIsReady || isLoading) {
    return <LoadingBall text="Cargando el campo de juego..." />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
          <ClerkLoaded>
            <AfterClerkLoaded />
          </ClerkLoaded>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
