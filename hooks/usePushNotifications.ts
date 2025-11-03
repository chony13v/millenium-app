import { useEffect } from "react";

export async function registerForPushNotificationsAsync(): Promise<
  string | undefined
> {
  console.info(
    "Push notifications disabled: registerForPushNotificationsAsync skipped."
  );
  return undefined;
}

export function useNotificationListeners() {
  useEffect(() => {
    console.info("Push notifications disabled: listeners not registered.");
  }, []);
}
