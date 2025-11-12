import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Random from "expo-random";

const ANON_STORAGE_KEY = "locationAnonId";

const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const ensureLocationUserId = async (
  clerkUserId: string | null | undefined
): Promise<string> => {
  if (clerkUserId) {
    return clerkUserId;
  }

  const cached = await AsyncStorage.getItem(ANON_STORAGE_KEY);
  if (cached) {
    return cached;
  }

  const randomBytes = await Random.getRandomBytesAsync(16);
  const anonId = bytesToHex(randomBytes);
  await AsyncStorage.setItem(ANON_STORAGE_KEY, anonId);
  return anonId;
};

export default ensureLocationUserId;
