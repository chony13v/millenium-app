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
import { useUser } from "@clerk/clerk-expo";
import { db } from "@/config/FirebaseConfig";
import { doc, getDoc, collection, addDoc, getDocs, deleteDoc as firestoreDeleteDoc } from "firebase/firestore";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { query, where } from 'firebase/firestore';

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
  const [events, setEvents] = useState<MarkedDateProps>({});
  const [eventDetails, setEventDetails] = useState<{ [key: string]: { description: string; id?: string; time?: string } }>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newEvent, setNewEvent] = useState({
    date: "",
    time: "",
    description: "",
  });

  const navigation = useNavigation();

  const handleGoBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !user.primaryEmailAddress?.emailAddress) return;
      const adminEmails = ["fvasconez13@icloud.com", "admin2@example.com"]; // Add admin emails here
      setIsAdmin(
        adminEmails.includes(user.primaryEmailAddress?.emailAddress || "")
      );
    };
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    fetchUserEvents();
  }, []);

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
      Alert.alert("Error", "No se pudo crear el evento");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchUserEvents = async () => {
    if (!user) return;
    try {
      const markedDates: MarkedDateProps = {};
      const details: { [key: string]: { description: string; id?: string; time?: string } } = {};
      const today = new Date().toISOString().split("T")[0];
      markedDates[today] = { marked: true, isEvent: false };

      const userRef = doc(db, "Participantes", user.id);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        const dateTime = data.dateTime;

        if (dateTime) {
          const convertToDate = (dateTimeStr: string) => {
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
            const match = dateTimeStr.match(regex);

            if (match) {
              const day = match[1].padStart(2, "0");
              const monthName: string = match[2].toLowerCase();
              const month = monthMap[monthName] || "01";
              const year = new Date().getFullYear();

              const date = `${year}-${month}-${day}`;
              details[date] = { description: dateTimeStr };
              markedDates[date] = { marked: true, isEvent: true, description: dateTimeStr };
              return date;
            }

            return null;
          };

          const date = convertToDate(dateTime);
          if (date) {
            setEvents(markedDates);
            setEventDetails(details);
          }
        } else {
          setEvents({ [today]: { marked: true, isEvent: false } });
        }
      }

      const globalEventsSnapshot = await getDocs(collection(db, 'GlobalEvents'));
      globalEventsSnapshot.forEach((doc) => {
        const eventData = doc.data();
        markedDates[eventData.date] = {
          marked: true,
          isEvent: true,
          description: eventData.description,
          id: doc.id, 
        };
        details[eventData.date] = { 
          description: eventData.description, 
          id: doc.id,
          time: eventData.time,};
      });

      setEvents(markedDates);
      setEventDetails(details);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleDeleteEvent = async (id: string, date: string) => {
    try {
      await firestoreDeleteDoc(doc(db, 'GlobalEvents', id));
      Alert.alert('Éxito', 'Evento eliminado correctamente');
      fetchUserEvents();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el evento');
    }
  };

  const handleDayPress = (day: DateData) => {
    const date = day.dateString;
    const event = eventDetails[date];
    if (event) {
      if (isAdmin && event.id) {
        Alert.alert(
          'Eliminar Evento',
          `${event.description}\nHora: ${event.time || 'No especificada'}`,
          [
            {
              text: 'Cancelar',
              style: 'cancel',
            },
            {
              text: 'Eliminar',
              style: 'destructive',
              onPress: () => handleDeleteEvent(event.id!, date),
            },
          ],
          { cancelable: true }
        );
      } else {
        Alert.alert('Evento GADM', `${event.description}\nHora: ${event.time || 'No especificada'}`);
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
            isToday && { color: "#6A0DAD", fontWeight: "bold" },
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
            color="#6A0DAD"
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
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Eventos del mes</Text>
      </View>
      <View style={styles.content}>
        <Calendar
          markingType={"custom"}
          markedDates={events}
          onDayPress={handleDayPress}
          dayComponent={({ date, state = "" }) =>
            date && renderDay({ date, state })
          }
          theme={{
            backgroundColor: "#ffffff",
            calendarBackground: "#ffffff",
            textSectionTitleColor: "#6A0DAD",
            selectedDayBackgroundColor: "#6A0DAD",
            selectedDayTextColor: "#ffffff",
            todayTextColor: "#6A0DAD",
            dayTextColor: "#2d4150",
            textDisabledColor: "#d9e1e8",
            arrowColor: "#6A0DAD",
            monthTextColor: "#6A0DAD",
            textDayFontFamily: "barlow-regular",
            textMonthFontFamily: "barlow-semibold",
            textDayHeaderFontFamily: "barlow-medium",
          }}
        />
      </View>
      {isAdmin && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <FontAwesome name="calendar-plus-o" size={50} color="#6A0DAD" />
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
              style={[styles.button, styles.saveButton, 
                isSaving && styles.saveButtonSaving,
              ]}
              onPress={handleAddEvent}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size='small' color="#FFFFFF" /> 
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'barlow-regular',
    color: '#000000',
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    backgroundColor: "#6A0DAD",
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
    color: "#2d4150",
  },
  disabledDayText: {
    color: "#d9e1e8",
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
});

