import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import AddEventModal from "@/components/modals/AddEventModal";
import { CITY_OPTIONS, type CityId } from "@/constants/cities";
import { Colors } from "@/constants/colors";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useCitySelection } from "@/hooks/useCitySelection";
import { ensureSpanishCalendarLocale } from "@/utils/calendarLocale";

ensureSpanishCalendarLocale();

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedCity, hasHydrated } = useCitySelection();
  const [modalVisible, setModalVisible] = useState(false);
  const [editEvent, setEditEvent] = useState<null | {
    id: string;
    date: string;
    time: string;
    description: string;
    cityId: CityId;
  }>(null);
  const { markedDates, eventDetails, isLoading, isAdminUser, refreshEvents } =
    useCalendarEvents(selectedCity, hasHydrated, true);

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
          cityId: event.cityId ?? selectedCity ?? CITY_OPTIONS[0].id,
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

  const todayString = useMemo(() => new Date().toISOString().split("T")[0], []);

  const renderDay = useCallback(
    ({ date, state }: { date: DateData; state: string }) => {
      const isToday = date.dateString === todayString;
      const hasEvent = markedDates[date.dateString]?.isEvent;

      return (
        <TouchableOpacity
          style={[
            styles.dayContainer,
            hasEvent && styles.dayWithEvent,
            isToday && styles.todayContainer,
          ]}
          onPress={() => handleDayPress(date)}
        >
          <Text
            style={[
              styles.dayText,
              isToday && styles.todayText,
              state === "disabled" && styles.disabledDayText,
            ]}
          >
            {date.day}
          </Text>
          {hasEvent && (
            <FontAwesome
              name="soccer-ball-o"
              size={14}
              color={markedDates[date.dateString]?.dotColor || "#0ea5e9"}
              style={styles.eventIcon}
            />
          )}
        </TouchableOpacity>
      );
    },
    [handleDayPress, markedDates, todayString]
  );

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: "#ffffff",
      calendarBackground: "#ffffff",
      textSectionTitleColor: "#0ea5e9",
      selectedDayBackgroundColor: "#0A2240",
      selectedDayTextColor: "#ffffff",
      todayTextColor: "#0A2240",
      dayTextColor: "#0A2240",
      textDisabledColor: "#cbd5e1",
      arrowColor: "#0A2240",
      monthTextColor: "#0A2240",
      textDayFontFamily: "barlow-regular",
      textMonthFontFamily: "barlow-semibold",
      textDayHeaderFontFamily: "barlow-medium",
    }),
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#1e3a8a", "#1e3a8a"]}
        start={[0, 0]}
        end={[1, 1]}
        style={[styles.heroCard, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.heroTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Calendario</Text>
        </View>
        <Text style={styles.heroSubtitle}>
          Visualiza pruebas, eventos del proyecto y tus fechas programadas.
        </Text>
      </LinearGradient>

      {isAdminUser && (
        <View style={styles.addEventRow}>
          <TouchableOpacity
            style={styles.addButtonCentered}
            onPress={() => {
              setEditEvent(null);
              setModalVisible(true);
            }}
            activeOpacity={0.9}
          >
            <FontAwesome
              name="calendar-plus-o"
              size={24}
              color={Colors.NAVY_BLUE}
            />
            <Text style={styles.addEventText}>
              Agregar eventos del proyecto
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.card}>
          {!selectedCity ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Selecciona una ciudad</Text>
              <Text style={styles.emptyMessage}>
                Elige un proyecto para ver los eventos disponibles.
              </Text>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.NAVY_BLUE} />
            </View>
          ) : (
            <Calendar
              markingType="custom"
              markedDates={markedDates}
              onDayPress={handleDayPress}
              dayComponent={({ date, state = "" }) =>
                date && renderDay({ date, state })
              }
              theme={calendarTheme}
            />
          )}
        </View>
      </View>
      <AddEventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={refreshEvents}
        mode={editEvent ? "edit" : "add"}
        initialEvent={editEvent || undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  heroCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    gap: 10,
    marginBottom: 12,
    minHeight: 170,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    color: "white",
    fontFamily: "barlow-semibold",
    fontSize: 18,
    marginLeft: 10,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: "barlow-regular",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minHeight: 320,
  },

  dayContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  dayWithEvent: {
    backgroundColor: "rgba(14,165,233,0.08)",
  },
  todayContainer: {
    borderWidth: 1,
    borderColor: "#0A2240",
    backgroundColor: "rgba(10,34,64,0.06)",
  },
  dayText: {
    fontSize: 15,
    color: Colors.NAVY_BLUE,
    fontFamily: "barlow-regular",
  },
  todayText: { fontFamily: "barlow-semibold", color: "#0A2240" },
  disabledDayText: { color: "#d9e1e8" },
  eventIcon: { marginTop: 2 },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "barlow-semibold",
    color: Colors.NAVY_BLUE,
  },
  emptyMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
    textAlign: "center",
    paddingHorizontal: 24,
  },

  addEventRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addButtonCentered: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#e0f2fe",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  addEventText: {
    fontSize: 14,
    color: Colors.NAVY_BLUE,
    fontFamily: "barlow-semibold",
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
});
