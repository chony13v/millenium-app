import "react-native-gesture-handler";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import SignIn from "@/app/(auth)/sign-in";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function Page() {
  useUser();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
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
