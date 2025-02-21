import 'react-native-gesture-handler';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo';
import SignIn from '@/app/(auth)/sign-in';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNotification } from '@/context/NotificationContext';
import { Text, Alert } from 'react-native';

export default function Page() {
  useUser();
  const { error } = useNotification();
  
  // Show error if notification setup fails
  if (error) {
    console.error('Notification Error:', error);
    Alert.alert('Notification Error', error.message);
  }
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {error && (
          <Text style={{ color: 'red', padding: 10 }}>
            Failed to setup notifications: {error.message}
          </Text>
        )}
        <SignedIn>
          <Redirect href="/home" />
        </SignedIn>
        <SignedOut>
          <SignIn />
        </SignedOut>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}