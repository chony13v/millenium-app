import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";

import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useCallback } from "react";
import LoadingBall from "@/components/LoadingBall";
import { ClerkAppProviders } from "@/components/provider/ClerkAppProviders";
import { publishableKey, tokenCache } from "@/config/ClerkConfig";

SplashScreen.preventAutoHideAsync();

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
            <ClerkAppProviders />
          </ClerkLoaded>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
