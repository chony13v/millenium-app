import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "@/config/FirebaseConfig";

type EventReportParams = {
  eventId: string;
  userId: string;
  attendanceId?: string;
  pointsAdded?: number;
};

const getEventReportRef = (userId: string, eventId: string) =>
  doc(db, "users", userId, "eventReports", eventId);

export const hasEventReport = async (eventId: string, userId: string) => {
  const snap = await getDoc(getEventReportRef(userId, eventId));
  return snap.exists();
};

export const markEventReported = async ({
  attendanceId,
  eventId,
  pointsAdded,
  userId,
}: EventReportParams) => {
  const ref = getEventReportRef(userId, eventId);
  await setDoc(
    ref,
    {
      eventId,
      userId,
      attendanceId: attendanceId ?? null,
      pointsAdded: pointsAdded ?? null,
      verified: true,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return ref.id;
};
