import type { CityId } from "@/constants/cities";

export type WeeklyEvent = {
  id: string;
  title: string;
  description: string;
  cityId?: CityId | "all";
  isActive?: boolean;
  active?: boolean;
  weekRange?: string | null;
  locationCenter?: AttendanceCoords | null;
  radiusMeters?: number | null;
};

export type AttendanceCoords = {
  latitude: number;
  longitude: number;
};

export type WeeklyEventAttendance = {
  id: string;
  eventId: string;
  userId: string;
  cityId: CityId;
  photoUrl?: string | null;
  coords?: AttendanceCoords | null;
  attendedAt?: Date | null;
  pointsStatus?: "pending" | "awarded" | "failed" | null;
};
