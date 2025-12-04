import {
  getDownloadURL,
  ref,
  uploadBytes,
  type FirebaseStorage,
} from "firebase/storage";

import { processReportPhoto } from "@/services/report/processReportPhoto";

type UploadEventPhotoParams = {
  eventId: string;
  photoUri: string;
  storage: FirebaseStorage;
  userId?: string;
};

export const uploadEventPhoto = async ({
  eventId,
  photoUri,
  storage,
  userId,
}: UploadEventPhotoParams) => {
  const processed = await processReportPhoto(photoUri);
  if (!processed) return null;

  const response = await fetch(processed);
  const blob = await response.blob();

  const extension = processed.split(".").pop() ?? "jpg";
  const safeUserId = userId ?? "anon";
  const storageRef = ref(
    storage,
    `weekly-events/${eventId}/${safeUserId}-${Date.now()}.${extension}`
  );

  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);

  return url;
};
