import { esES } from "@clerk/localizations";
import { tokenCache } from "@/utils/cache";

export const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
export const localization = esES;

export { tokenCache };