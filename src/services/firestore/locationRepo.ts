import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "@/config/FirebaseConfig";

const COLLECTION = "locationBuckets";

export interface LocationBucketDocument {
  userId: string;
  city: string | null;
  citySlug: string | null;
  neighborhood: string | null;
  neighborhoodSlug: string | null;
  latBucket: number | null;
  lonBucket: number | null;
  accuracy: number | null;
  locationOptIn: boolean;
  expoPushToken: string | null;
  updatedAt?: Date | Timestamp | null;
}

export type LocationBucketUpdate = {
  city?: string | null;
  citySlug?: string | null;
  neighborhood?: string | null;
  neighborhoodSlug?: string | null;
  latBucket?: number | null;
  lonBucket?: number | null;
  accuracy?: number | null;
  locationOptIn: boolean;
  expoPushToken?: string | null;
};

export const upsertUserLocation = async (
  userId: string,
  update: LocationBucketUpdate
): Promise<void> => {
  const docRef = doc(db, COLLECTION, userId);
  const payload: Record<string, unknown> = {
    userId,
    locationOptIn: update.locationOptIn,
    updatedAt: serverTimestamp(),
  };

  if ("city" in update) {
    payload.city = update.city ?? null;
  }
  if ("citySlug" in update) {
    payload.citySlug = update.citySlug ?? null;
  }
  if ("neighborhood" in update) {
    payload.neighborhood = update.neighborhood ?? null;
  }
  if ("neighborhoodSlug" in update) {
    payload.neighborhoodSlug = update.neighborhoodSlug ?? null;
  }
  if ("latBucket" in update) {
    payload.latBucket = update.latBucket ?? null;
  }
  if ("lonBucket" in update) {
    payload.lonBucket = update.lonBucket ?? null;
  }
  if ("accuracy" in update) {
    payload.accuracy = update.accuracy ?? null;
  }
  if ("expoPushToken" in update) {
    payload.expoPushToken = update.expoPushToken ?? null;
  }

  await setDoc(docRef, payload, { merge: true });
};

export const getUserLocation = async (
  userId: string
): Promise<LocationBucketDocument | null> => {
  const docRef = doc(db, COLLECTION, userId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    userId: data.userId ?? userId,
    city: (data.city ?? null) as string | null,
    citySlug: (data.citySlug ?? null) as string | null,
    neighborhood: (data.neighborhood ?? null) as string | null,
    neighborhoodSlug: (data.neighborhoodSlug ?? null) as string | null,
    latBucket: (data.latBucket ?? null) as number | null,
    lonBucket: (data.lonBucket ?? null) as number | null,
    accuracy: (data.accuracy ?? null) as number | null,
    locationOptIn: Boolean(data.locationOptIn),
    expoPushToken: (data.expoPushToken ?? null) as string | null,
    updatedAt: (data.updatedAt ?? null) as Date | Timestamp | null,
  };
};
