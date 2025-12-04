import { getFunctions, httpsCallable } from "firebase/functions";

import { app } from "@/config/FirebaseConfig";
import type { AttendanceCoords } from "./types";

export type VerifyAttendanceResponse = {
  verified: boolean;
  distanceMeters: number;
  pointsAdded: number;
};

type VerifyAttendanceParams = {
  attendanceId: string;
  eventId: string;
  userId: string;
  coords: AttendanceCoords;
};

export const verifyWeeklyEventAttendance = async ({
  attendanceId,
  coords,
  eventId,
  userId,
}: VerifyAttendanceParams): Promise<VerifyAttendanceResponse> => {
  const functions = getFunctions(app);
  const callable = httpsCallable(functions, "verifyWeeklyEventAttendance");
  const result = await callable({
    attendanceId,
    coords,
    eventId,
    userId,
  });

  return result.data as VerifyAttendanceResponse;
};
