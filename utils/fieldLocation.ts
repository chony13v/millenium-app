import { Linking, Image } from "react-native";

interface FieldLocation {
  id: string;
  imageUrl: string;
  latitude?: number;
  longitude?: number;
  locationUrl?: string;
}

type PrefetchCallbacks = {
  onPending: (fieldId: string) => void;
  onLoaded: (fieldId: string) => void;
  onFailed: (fieldId: string) => void;
  registerTimeout: (timeoutId: ReturnType<typeof setTimeout>) => void;
  isMounted: () => boolean;
  timeoutMs?: number;
};

export const handleLocationPress = (
  locationUrl?: string,
  latitude?: number,
  longitude?: number
) => {
  if (locationUrl) {
    Linking.openURL(locationUrl);
  } else if (latitude && longitude) {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  }
};

export const prefetchFieldImage = async (
  field: FieldLocation,
  {
    onPending,
    onLoaded,
    onFailed,
    registerTimeout,
    isMounted,
    timeoutMs = 12000,
  }: PrefetchCallbacks
) => {
  onPending(field.id);

  return new Promise<void>((resolve) => {
    const timeoutId = setTimeout(() => {
      if (!isMounted()) return resolve();
      onFailed(field.id);
      resolve();
    }, timeoutMs);

    registerTimeout(timeoutId);

    Image.prefetch(field.imageUrl)
      .then((success) => {
        if (!isMounted()) return;
        clearTimeout(timeoutId);
        if (success) {
          onLoaded(field.id);
        } else {
          onFailed(field.id);
        }
      })
      .catch(() => {
        if (!isMounted()) return;
        clearTimeout(timeoutId);
        onFailed(field.id);
      })
      .finally(() => {
        resolve();
      });
  });
};
