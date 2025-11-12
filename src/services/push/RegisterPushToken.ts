import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "@/config/FirebaseConfig";

const COLLECTION = "locationBuckets";
const CHANNEL_ID = "default";

export const registerForPushNotificationsAsync = async (): Promise<
  string | null
> => {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const request = await Notifications.requestPermissionsAsync();
      finalStatus = request.status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const token = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    return token.data ?? null;
  } catch (error) {
    console.warn("Failed to register for push notifications", error);
    return null;
  }
};

interface AttachOptions {
  citySlug?: string | null;
  neighborhoodSlug?: string | null;
}

export const attachPushTokenToUser = async (
  userId: string,
  token: string,
  options: AttachOptions = {}
): Promise<void> => {
  const docRef = doc(db, COLLECTION, userId);
  const payload: Record<string, unknown> = {
    expoPushToken: token,
    updatedAt: serverTimestamp(),
  };

  if ("citySlug" in options) {
    payload.citySlug = options.citySlug ?? null;
  }

  if ("neighborhoodSlug" in options) {
    payload.neighborhoodSlug = options.neighborhoodSlug ?? null;
  }

  await setDoc(docRef, payload, { merge: true });
};
