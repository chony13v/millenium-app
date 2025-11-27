import { Platform } from "react-native";
import Constants from "expo-constants";

export const APP_VERSION =
  Constants.expoConfig?.version ??
  (Constants.manifest as Partial<{ version?: string }> | null)?.version ??
  (Constants as unknown as { manifest2?: { version?: string } }).manifest2
    ?.version ??
  "unknown";

export const PLATFORM = Platform.OS;
