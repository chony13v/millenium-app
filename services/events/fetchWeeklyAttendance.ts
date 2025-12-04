import {
  Timestamp,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/config/FirebaseConfig";
import type { WeeklyEventAttendance } from "./types";

export const fetchWeeklyAttendance = async (
  userId: string
): Promise<Record<string, WeeklyEventAttendance>> => {
  const attendanceByEvent: Record<string, WeeklyEventAttendance> = {};

  const q = query(
    collection(db, "weeklyEventAttendance"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as Partial<WeeklyEventAttendance> & {
      attendedAt?: Timestamp;
    };

    if (!data.eventId || !data.cityId) return;

    attendanceByEvent[data.eventId] = {
      id: docSnap.id,
      eventId: data.eventId,
      userId: data.userId ?? userId,
      cityId: data.cityId,
      coords: data.coords ?? null,
      photoUrl: data.photoUrl ?? null,
      attendedAt: data.attendedAt instanceof Timestamp
        ? data.attendedAt.toDate()
        : null,
      pointsStatus: (data.pointsStatus as WeeklyEventAttendance["pointsStatus"]) ?? null,
    };
  });

  return attendanceByEvent;
};
