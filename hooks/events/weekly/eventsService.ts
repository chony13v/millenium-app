import {
  hasEventReport,
  markEventReported,
} from "@/services/events/eventReports";
import { fetchWeeklyAttendance } from "@/services/events/fetchWeeklyAttendance";
import { fetchWeeklyEvents } from "@/services/events/fetchWeeklyEvents";
import { saveWeeklyAttendance } from "@/services/events/saveWeeklyAttendance";
import { uploadEventPhoto } from "@/services/events/uploadEventPhoto";
import { verifyWeeklyAttendanceFallback } from "@/services/events/verifyWeeklyAttendanceFallback";
import { verifyWeeklyEventAttendance } from "@/services/events/verifyWeeklyEventAttendance";
import type { AttendanceCoords } from "@/services/events/types";
import type { CityId } from "@/constants/cities";
import type { FirebaseStorage } from "firebase/storage";

export type EventsService = {
  fetchEvents: typeof fetchWeeklyEvents;
  fetchAttendance: typeof fetchWeeklyAttendance;
  uploadPhoto: typeof uploadEventPhoto;
  saveAttendance: typeof saveWeeklyAttendance;
  verifyAttendance: typeof verifyWeeklyEventAttendance;
  verifyAttendanceFallback: typeof verifyWeeklyAttendanceFallback;
  hasReport: typeof hasEventReport;
  markReported: typeof markEventReported;
};

export const createEventsService = (): EventsService => ({
  fetchEvents: fetchWeeklyEvents,
  fetchAttendance: fetchWeeklyAttendance,
  uploadPhoto: uploadEventPhoto,
  saveAttendance: saveWeeklyAttendance,
  verifyAttendance: verifyWeeklyEventAttendance,
  verifyAttendanceFallback: verifyWeeklyAttendanceFallback,
  hasReport: hasEventReport,
  markReported: markEventReported,
});

export type AttendanceSavePayload = {
  cityId: CityId;
  coords: AttendanceCoords;
  eventId: string;
  existingAttendanceId?: string;
  photoUrl?: string | null;
  pointsStatus?: "pending" | "awarded" | "failed";
  userId: string;
};

export type UploadPhotoPayload = {
  eventId: string;
  photoUri: string;
  storage: FirebaseStorage;
  userId?: string;
};
