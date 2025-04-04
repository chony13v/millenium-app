import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Calendar, LocaleConfig, DateData } from "react-native-calendars";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { db } from "@/config/FirebaseConfig";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc as firestoreDeleteDoc,
} from "firebase/firestore";
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { query, where } from "firebase/firestore";
import { Colors } from "@/constants/Colors";
import { ADMIN_EMAILS } from "@/config/AdminConfig";

LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthNamesShort: [
    "Ene.",
    "Feb.",
    "Mar.",
    "Abr.",
    "May.",
    "Jun.",
    "Jul.",
    "Ago.",
    "Sep.",
    "Oct.",
    "Nov.",
    "Dic.",
  ],
  dayNames: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ],
  dayNamesShort: ["Dom.", "Lun.", "Mar.", "Mié.", "Jue.", "Vie.", "Sáb."],
};

LocaleConfig.defaultLocale = "es";

interface MarkedDateProps {
  [date: string]: {
    marked: boolean;
    isEvent?: boolean;
    customStyles?: {
      container?: object;
      text?: object;
    };
    description?: string;
    id?: string;
    time?: string;
  };
}

export default function CalendarScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<MarkedDateProps>({});
  const [isLoading, setIsLoading] = useState(false);
  const [eventDetails, setEventDetails] = useState<{
    [key: string]: { description: string; id?: string; time?: string };
  }>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newEvent, setNewEvent] = useState({
    date: "",
    time: "",
    description: "",
  });

  const handleGoBack = () => {
    router.back();
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;
      
      try {
        const token = await getToken({ template: "integration_firebase" });
        
        if (!token) return;

        // Sign in to Firebase with the token
        const auth = getAuth();
        await signInWithCustomToken(auth, token);

        setIsAdmin(
          ADMIN_EMAILS.includes(
            user.primaryEmailAddress.emailAddress as (typeof ADMIN_EMAILS)[number]
          )
        );
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    
    checkAdminStatus();
    fetchUserEvents();
  }, [user]);

  const fetchUserEvents = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const markedDates: MarkedDateProps = {};
      const details: {
        [key: string]: { description: string; id?: string; time?: string };
      } = {};

      // Mark today's date
      const today = new Date().toISOString().split("T")[0];
      markedDates[today] = { marked: true, isEvent: false };

      // Fetch user's personal events
      const userRef = doc(db, "Participantes", user.id);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        const dateTime = data.dateTime;

        if (dateTime) {
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

          const regex = /(\d{1,2}) de (\w+) - \d{1,2}:\d{2} (am|pm)/i;
          const match = dateTime.match(regex);
          if (match) {
            const day = match[1].padStart(2, "0");
            const monthName = match[2].toLowerCase();
            const month = monthMap[monthName] || "01";
            const year = new Date().getFullYear();
            const date = `${year}-${month}-${day}`;

            markedDates[date] = {
              marked: true,
              isEvent: true,
              description: dateTime,
            };
            details[date] = { description: dateTime };
          }
        }
      }

      // Fetch global events
      const globalEventsSnapshot = await getDocs(
        collection(db, "GlobalEvents")
      );
      globalEventsSnapshot.forEach((docSnap) => {
        const eventData = docSnap.data();
        markedDates[eventData.date] = {
          marked: true,
          isEvent: true,
          description: eventData.description,
          id: docSnap.id,
        };
        details[eventData.date] = {
          description: eventData.description,
          id: docSnap.id,
          time: eventData.time,
        };
      });

      // Update state only once with all events
      setEvents(markedDates);
      setEventDetails(details);
    } catch (error) {
      console.error("Error fetching events:", error);
      Alert.alert("Error", "No se pudieron cargar los eventos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (isSaving) return;

    if (!newEvent.date || !newEvent.description || !newEvent.time) {
      Alert.alert("Error", "Por favor complete todos los campos");
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newEvent.date)) {
      Alert.alert("Error", "Formato de fecha inválido. Use YYYY-MM-DD");
      return;
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newEvent.time)) {
      Alert.alert("Error", "Formato de hora inválido. Use HH:MM");
      return;
    }

    setIsSaving(true);

    try {
      const existingEvents = await getDocs(
        query(
          collection(db, "GlobalEvents"),
          where("date", "==", newEvent.date),
          where("time", "==", newEvent.time)
        )
      );

      if (!existingEvents.empty) {
        Alert.alert("Error", "Ya existe un evento en esta fecha y hora");
        setIsSaving(false);
        return;
      }

      await addDoc(collection(db, "GlobalEvents"), {
        date: newEvent.date,
        time: newEvent.time,
        description: newEvent.description,
        createdAt: new Date(),
      });

      Alert.alert("Éxito", "Evento guardado correctamente");
      setModalVisible(false);
      setNewEvent({ date: "", time: "", description: "" });
      fetchUserEvents();
    } catch (error) {
      console.error("Firestore addDoc error:", error);
      Alert.alert("Error", "No se pudo crear el evento");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string, date: string) => {
    try {
      await firestoreDeleteDoc(doc(db, "GlobalEvents", id));
      Alert.alert("Éxito", "Evento eliminado correctamente");
      fetchUserEvents();
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar el evento");
    }
  };

  const handleDayPress = (day: DateData) => {
    const date = day.dateString;
    const event = eventDetails[date];
    if (event) {
      if (isAdmin && event.id) {
        Alert.alert(
          "Eliminar Evento",
          `${event.description}\nHora: ${event.time || "No especificada"}`,
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Eliminar",
              style: "destructive",
              onPress: () => handleDeleteEvent(event.id!, date),
            },
          ],
          { cancelable: true }
        );
      } else {
        Alert.alert(
          "Evento GADM",
          `${event.description}\nHora: ${event.time || "No especificada"}`
        );
      }
    }
  };

  const renderDay = ({ date, state }: { date: DateData; state: string }) => {
    const hasEvent = events[date.dateString]?.isEvent;
    const isToday = date.dateString === new Date().toISOString().split("T")[0];
    const isSelected = false;

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
            isSelected && styles.selectedDayText,
          ]}
        >
          {date.day}
        </Text>
        {hasEvent && (
          <FontAwesome
            name="soccer-ball-o"
            size={16}
            color="#F02B44"
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
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.NAVY_BLUE} />
          </View>
        ) : (
          <Calendar
            markingType="custom"
            markedDates={events}
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
      {isAdmin && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <FontAwesome
            name="calendar-plus-o"
            size={50}
            color={Colors.NAVY_BLUE}
          />
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Agregar Evento Global</Text>
          <TextInput
            style={styles.input}
            placeholder="Fecha (YYYY-MM-DD)"
            value={newEvent.date}
            onChangeText={(text) => setNewEvent({ ...newEvent, date: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Hora (HH:MM)"
            value={newEvent.time}
            onChangeText={(text) => setNewEvent({ ...newEvent, time: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Descripción del evento"
            value={newEvent.description}
            onChangeText={(text) =>
              setNewEvent({ ...newEvent, description: text })
            }
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                isSaving && styles.saveButtonSaving,
              ]}
              onPress={handleAddEvent}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
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
  backButton: {
    marginLeft: 20,
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginTop: "auto",
    marginBottom: "auto",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "barlow-regular",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    padding: 10,
    borderRadius: 10,
    width: "45%",
  },
  saveButton: {
    backgroundColor: Colors.NAVY_BLUE,
  },
  saveButtonSaving: {
    backgroundColor: "#A020F0",
  },
  cancelButton: {
    backgroundColor: "#888",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontFamily: "barlow-semibold",
  },
  dayContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
  dayText: {
    fontSize: 16,
    color: Colors.NAVY_BLUE,
  },
  disabledDayText: {
    color: Colors.NAVY_BLUE,
  },
  selectedDayText: {
    color: "#ffffff",
  },
  eventIcon: {
    marginTop: 2,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 3,
    backgroundColor: "red",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
