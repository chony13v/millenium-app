export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  console.info(
    "Push notifications disabled: registerForPushNotificationsAsync skipped."
  );
  return undefined;
}

export function registerNotificationListeners() {
  console.info("Push notifications disabled: listeners not registered.");
}