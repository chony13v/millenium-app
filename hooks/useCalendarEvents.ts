import { useCallback, useEffect, useState } from "react";

import { useAuth, useUser } from "@clerk/clerk-expo";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { isAdmin } from "@/config/AdminConfig";
import { db } from "@/config/FirebaseConfig";
import { type CityId, isCityId } from "@/constants/cities";
import { linkClerkSessionToFirebase } from "@/services/auth/firebaseAuth";

export type MarkedDate = {
  marked: boolean;
  dotColor: string;
  isEvent: boolean;
};
export type MarkedDatesMap = Record<string, MarkedDate>;
export type CalendarEventDetail = {
  description: string;
  id?: string;
  time?: string;
  cityId?: CityId;
};

const parseDateTime = (dateTime: string): string | null => {
  const regex = /(\d{1,2}) de (\w+) - (\d{1,2}:\d{2} (am|pm))/i;
  const match = dateTime.match(regex);
  if (!match) return null;

  const day = match[1].padStart(2, "0");
  const monthName = match[2].toLowerCase();
  const monthMap: { [key: string]: string } = {
    enero: "01",
    febrero: "02",
    marzo: "03",
    abril: "04",
    mayo: "05",
    junio: "06",
    julio: "07",
    agosto: "08",
    septiembre: "09",
    octubre: "10",
    noviembre: "11",
    diciembre: "12",
  };
  const month = monthMap[monthName];
  const year = new Date().getFullYear();

  return `${year}-${month}-${day}`;
};

export function useCalendarEvents(
  selectedCity: CityId | null | undefined,
  hasHydrated: boolean,
  firebaseReady: boolean
) {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [markedDates, setMarkedDates] = useState<MarkedDatesMap>({});
  const [eventDetails, setEventDetails] = useState<
    Record<string, CalendarEventDetail>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    linkClerkSessionToFirebase(getToken)
      .then(() => {
        const email = user.primaryEmailAddress?.emailAddress;
        if (email && isAdmin(email)) setIsAdminUser(true);
      })
      .catch((error) => {
        console.error("Error al autenticar con Firebase:", error);
      });
  }, [getToken, user]);

  const loadCityEvents = useCallback(
    async (cityId: CityId) => {
      if (!user || !firebaseReady) {
        return;
      }

      setIsLoading(true);

      try {
        const marked: MarkedDatesMap = {};
        const details: Record<string, CalendarEventDetail> = {};

        const userRef = doc(db, "Participantes", user.id);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data() as { dateTime?: string; city?: string };
          const dateTime = data.dateTime;
          if (data.city === cityId && dateTime) {
            const parsedDate = parseDateTime(dateTime);
            if (parsedDate) {
              marked[parsedDate] = {
                marked: true,
                dotColor: "#F02B44",
                isEvent: true,
              };
              details[parsedDate] = { description: dateTime };
            }
          }
        }

        const eventsQuery = query(
          collection(db, "GlobalEvents"),
          where("cityId", "==", cityId)
        );
        const globalSnapshot = await getDocs(eventsQuery);
        globalSnapshot.forEach((docSnap) => {
          const data = docSnap.data() as {
            date?: string;
            description?: string;
            time?: string;
            cityId?: string;
          };
          const date = data.date;
          if (!date) {
            return;
          }

          marked[date] = { marked: true, dotColor: "#A020F0", isEvent: true };
          details[date] = {
            description: data.description ?? "",
            id: docSnap.id,
            time: data.time,
            cityId: isCityId(data.cityId) ? data.cityId : undefined,
          };
        });

        setMarkedDates(marked);
        setEventDetails(details);
      } catch (err) {
        console.error("Error cargando eventos:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [firebaseReady, user]
  );

  useEffect(() => {
    if (!firebaseReady || !hasHydrated || !selectedCity) {
      if (!firebaseReady || !hasHydrated) return;
      if (!selectedCity) {
        setMarkedDates({});
        setEventDetails({});
        setIsLoading(false);
      }
      return;
    }

    loadCityEvents(selectedCity);
  }, [firebaseReady, hasHydrated, loadCityEvents, selectedCity]);

  const refreshEvents = useCallback(() => {
    if (selectedCity) {
      loadCityEvents(selectedCity);
    }
  }, [loadCityEvents, selectedCity]);

  return {
    markedDates,
    eventDetails,
    isLoading,
    isAdminUser,
    refreshEvents,
  };
}
