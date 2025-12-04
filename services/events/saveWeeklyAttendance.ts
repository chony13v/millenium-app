import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "@/config/FirebaseConfig";
import type { CityId } from "@/constants/cities";
import type { AttendanceCoords } from "./types";

type SaveWeeklyAttendanceParams = {
  eventId: string;
  userId: string;
  cityId: CityId;
  coords: AttendanceCoords;
  photoUrl?: string | null;
  existingAttendanceId?: string;
  pointsStatus?: "pending" | "awarded" | "failed";
};

export const saveWeeklyAttendance = async ({
  cityId,
  coords,
  eventId,
  existingAttendanceId,
  photoUrl,
  pointsStatus = "pending",
  userId,
}: SaveWeeklyAttendanceParams) => {
  const basePayload = {
    eventId,
    userId,
    cityId,
    coords,
    photoUrl: photoUrl ?? null,
    pointsStatus,
  };
  const payload = existingAttendanceId
    ? { ...basePayload }
    : { ...basePayload, attendedAt: serverTimestamp() };

  if (existingAttendanceId) {
    await setDoc(
      doc(db, "weeklyEventAttendance", existingAttendanceId),
      {
        ...payload,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return existingAttendanceId;
  }

  const docRef = await addDoc(collection(db, "weeklyEventAttendance"), {
    ...payload,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};
