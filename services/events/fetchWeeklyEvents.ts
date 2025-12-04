import { collection, getDocs } from "firebase/firestore";

import { db } from "@/config/FirebaseConfig";
import type { CityId } from "@/constants/cities";
import type { WeeklyEvent } from "./types";

type FetchWeeklyEventsParams = {
  selectedCity: CityId | null;
};

export const fetchWeeklyEvents = async ({
  selectedCity,
}: FetchWeeklyEventsParams): Promise<WeeklyEvent[]> => {
  const snapshot = await getDocs(collection(db, "weeklyEvents"));
  const events: WeeklyEvent[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as Partial<WeeklyEvent>;
    const targetCity = data.cityId as CityId | "all" | undefined;
    const isActiveFlag = data.isActive ?? data.active ?? true;

    if (!isActiveFlag) return;

    if (
      !selectedCity ||
      !targetCity ||
      targetCity === "all" ||
      targetCity === selectedCity
    ) {
      events.push({
        id: docSnap.id,
        title: data.title ?? "Evento semanal",
        description: data.description ?? "",
        cityId: targetCity,
        isActive: isActiveFlag,
        active: isActiveFlag,
        weekRange: data.weekRange ?? null,
        locationCenter: data.locationCenter ?? null,
        radiusMeters: typeof data.radiusMeters === "number" ? data.radiusMeters : null,
      });
    }
  });

  return events;
};
