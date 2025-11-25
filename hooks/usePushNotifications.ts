import { useEffect } from "react";
import {
  registerForPushNotificationsAsync as registerForPushNotificationsAsyncService,
  registerNotificationListeners,
} from "@/services/notifications/push";

export const registerForPushNotificationsAsync =
  registerForPushNotificationsAsyncService;

export function useNotificationListeners() {
  useEffect(() => {
    registerNotificationListeners();
  }, []);
}