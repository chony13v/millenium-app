import 'react-native-gesture-handler';
import { tokenCache } from '@/utils/cache';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotificationProvider } from '@/context/NotificationContext';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { registerForPushNotificationsAsync } from '@/utils/registerForPushNotificationsAsync';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  useEffect(() => {
    async function prepare() {
      try {
        // Setup notifications
        const storedToken = await AsyncStorage.getItem('pushToken');
        if (storedToken) {
          setExpoPushToken(storedToken);
        }

        const token = await registerForPushNotificationsAsync();
        if (token) {
          await AsyncStorage.setItem('pushToken', token);
          setExpoPushToken(token);
        }
      } catch (e) {
        console.warn('Error preparing app:', e);
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
    throw new Error('Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env');
  }

  if (!appIsReady || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
          <ClerkLoaded>
            <NotificationProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(call)" options={{ headerShown: false }} />
              </Stack>
            </NotificationProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}