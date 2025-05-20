
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Calendar, LocaleConfig, DateData } from "react-native-calendars";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { db } from "@/config/FirebaseConfig";
import { Colors } from "@/constants/Colors";
import { ADMIN_EMAILS, isAdmin } from "@/config/AdminConfig";
import AddEventModal from "@/components/modals/AddEventModal";

const auth = getAuth();

LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ],
  monthNamesShort: [
    "Ene.", "Feb.", "Mar.", "Abr.", "May.", "Jun.",
    "Jul.", "Ago.", "Sep.", "Oct.", "Nov.", "Dic."
  ],
  dayNames: [
    "Domingo", "Lunes", "Martes", "Miércoles",
    "Jueves", "Viernes", "Sábado"
  ],
  dayNamesShort: ["Dom.", "Lun.", "Mar.", "Mié.", "Jue.", "Vie.", "Sáb."]
};
LocaleConfig.defaultLocale = "es";

export default function CalendarScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [markedDates, setMarkedDates] = useState<any>({});
  const [eventDetails, setEventDetails] = useState<{ [key: string]: { description: string; id?: string; time?: string } }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editEvent, setEditEvent] = useState<null | { id: string; date: string; time: string; description: string }>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    const checkAndSignIn = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;

      try {
        const token = await getToken({ template: "integration_firebase" });
        if (!token) throw new Error("No se recibió token de Firebase");

        await signInWithCustomToken(auth, token);
        setFirebaseReady(true);

        const email = user.primaryEmailAddress.emailAddress;
        if (isAdmin(email)) setIsAdminUser(true);
      } catch (error) {
        console.error("Error al autenticar con Firebase:", error);
      }
    };

    checkAndSignIn();
  }, [user]);

  useEffect(() => {
    if (firebaseReady) {
      loadUserEvent();
    }
  }, [firebaseReady]);

  const handleGoBack = () => router.back();

  const handleDayPress = (day: DateData) => {
    const date = day.dateString;
    const event = eventDetails[date];

    if (event) {
      if (isAdminUser && event.id) {
        setEditEvent({
          id: event.id,
          date,
          time: event.time || "",
          description: event.description,
        });
        setModalVisible(true);
      } else {
        const isGlobal = !!event.id;
        const title = isGlobal ? "Evento" : "DÍA DE PRUEBAS DE SELECCIÓN";
        const message = isGlobal
          ? `${event.description}\nHora: ${event.time || "No especificada"}`
          : `${event.description}`;
        Alert.alert(title, message);
      }
    }
  };

  const parseDateTime = (dateTime: string): string | null => {
    const regex = /(\d{1,2}) de (\w+) - (\d{1,2}:\d{2} (am|pm))/i;
    const match = dateTime.match(regex);
    if (!match) return null;

    const day = match[1].padStart(2, "0");
    const monthName = match[2].toLowerCase();
    const monthMap: { [key: string]: string } = {
      enero: "01", febrero: "02", marzo: "03", abril: "04", mayo: "05", junio: "06",
      julio: "07", agosto: "08", septiembre: "09", octubre: "10", noviembre: "11", diciembre: "12",
    };
    const month = monthMap[monthName];
    const year = new Date().getFullYear();

    return `${year}-${month}-${day}`;
  };

  const loadUserEvent = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const marked: any = {};
      const details: any = {};

      const userRef = doc(db, "Participantes", user.id);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        const dateTime = data.dateTime;
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

      const globalSnapshot = await getDocs(collection(db, "GlobalEvents"));
      globalSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const date = data.date;
        marked[date] = {
          marked: true,
          dotColor: "#A020F0",
          isEvent: true,
        };
        details[date] = {
          description: data.description,
          id: docSnap.id,
          time: data.time,
        };
      });

      setMarkedDates(marked);
      setEventDetails(details);
    } catch (err) {
      console.error("Error cargando eventos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDay = ({ date, state }: { date: DateData; state: string }) => {
    const isToday = date.dateString === new Date().toISOString().split("T")[0];
    const hasEvent = markedDates[date.dateString]?.isEvent;

    return (
      <TouchableOpacity
        style={styles.dayContainer}
        onPress={() => handleDayPress(date)}
      >
        <Text
          style={[
            styles.dayText,
            isToday && { color: "#242c44", fontWeight: "bold" },
            state === "disabled" && styles.disabledDayText,
          ]}
        >
          {date.day}
        </Text>
        {hasEvent && (
          <FontAwesome
            name="soccer-ball-o"
            size={16}
            color={markedDates[date.dateString]?.dotColor || "#F02B44"}
            style={styles.eventIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBackground}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#242c44" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Eventos del mes</Text>
      </View>

      {isAdminUser && (
        <View style={styles.addEventRow}>
          <TouchableOpacity
            style={styles.addButtonCentered}
            onPress={() => {
              setEditEvent(null);
              setModalVisible(true);
            }}
          >
            <FontAwesome name="calendar-plus-o" size={30} color={Colors.NAVY_BLUE} />
            <Text style={styles.addEventText}>Agregar eventos globales</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.NAVY_BLUE} />
        ) : (
          <Calendar
            markingType="custom"
            markedDates={markedDates}
            onDayPress={handleDayPress}
            dayComponent={({ date, state = "" }) =>
              date && renderDay({ date, state })
            }
            theme={{
              backgroundColor: "#ffffff",
              calendarBackground: "#ffffff",
              textSectionTitleColor: "#F02B44",
              selectedDayBackgroundColor: "#F02B44",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#F02B44",
              dayTextColor: "#F02B44",
              textDisabledColor: "#d9e1e8",
              arrowColor: "#242c44",
              monthTextColor: "#242c44",
              textDayFontFamily: "barlow-regular",
              textMonthFontFamily: "barlow-semibold",
              textDayHeaderFontFamily: "barlow-medium",
            }}
          />
        )}
      </View>

      <AddEventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={loadUserEvent}
        mode={editEvent ? "edit" : "add"}
        initialEvent={editEvent || undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  headerBackground: {
    backgroundColor: "#FFFFFF",
    height: 80,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "barlow-regular",
    color: "#000000",
    marginLeft: 10,
  },
  backButton: { marginLeft: 20 },
  content: { flex: 1, backgroundColor: "#FFFFFF", padding: 20 },
  dayContainer: { alignItems: "center", justifyContent: "center", padding: 5 },
  dayText: { fontSize: 16, color: Colors.NAVY_BLUE },
  disabledDayText: { color: "#d9e1e8" },
  eventIcon: { marginTop: 2 },
  addEventRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  addButtonCentered: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addEventText: {
    fontSize: 16,
    color: Colors.NAVY_BLUE,
    fontFamily: "barlow-medium",
  },
});
