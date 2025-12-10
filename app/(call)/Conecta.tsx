import React, { useMemo, useRef } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { getStorage } from "firebase/storage";

import { conectaStyles as styles } from "@/styles/conectaStyles";
import { HeroCard } from "@/components/conecta/HeroCard";
import { ReportForm } from "@/components/conecta/ReportForm";
import { SurveySection } from "@/components/conecta/SurveySection";
import { WeeklyEventsSection } from "@/components/events/WeeklyEventsSection";
import { app } from "@/config/FirebaseConfig";
import { useCitySelection } from "@/hooks/useCitySelection";
import { useReportForm } from "@/hooks/conecta/useReportForm";
import { useSurveys } from "@/hooks/conecta/useSurveys";
import { useWeeklyEvents } from "@/hooks/events";
import { useFirebaseUid } from "@/hooks/useFirebaseUid";
export default function Conecta() {
  const { user } = useUser();
  const { selectedCity, hasHydrated } = useCitySelection();
  const { firebaseUid } = useFirebaseUid();
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const sectionY = useRef<{ survey?: number; community?: number; reports?: number }>({});

  const storage = useMemo(() => getStorage(app), []);

  const {
    surveys,
    surveyResponses,
    surveysLoading,
    surveyError,
    sendingSurvey,
    handleAnswerSurvey,
  } = useSurveys({
    hasHydrated,
    selectedCity,
    userEmail: user?.primaryEmailAddress?.emailAddress ?? null,
    userId: firebaseUid ?? undefined,
  });

  const {
    coords,
    description,
    handleSubmitReport,
    locationLoading,
    locationText,
    pickPhoto,
    photoUri,
    problemType,
    requestCoords,
    resetForm,
    setDescription,
    setLocationText,
    setProblemType,
    submittingReport,
  } = useReportForm({
    selectedCity,
    storage,
    userId: firebaseUid ?? undefined,
  });

  const {
    attendance,
    events,
    eventsLoading,
    error: eventsError,
    handleRegisterAttendance,
    submittingAttendance,
  } = useWeeklyEvents({
    hasHydrated,
    selectedCity,
    storage,
    userId: firebaseUid ?? undefined,
  });

  const handleCancelReport = () => {
    Alert.alert("Cancelar reporte", "¿Descartar y volver al inicio?", [
      { text: "Seguir aquí", style: "cancel" },
      {
        text: "Sí, cancelar",
        style: "destructive",
        onPress: () => {
          resetForm();
          router.replace("/(call)/Home");
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HeroCard
          onPressSurvey={() => {
            if (sectionY.current.survey != null) {
              scrollRef.current?.scrollTo({ y: sectionY.current.survey, animated: true });
            }
          }}
          onPressCommunity={() => {
            if (sectionY.current.community != null) {
              scrollRef.current?.scrollTo({ y: sectionY.current.community, animated: true });
            }
          }}
          onPressReports={() => {
            if (sectionY.current.reports != null) {
              scrollRef.current?.scrollTo({ y: sectionY.current.reports, animated: true });
            }
          }}
        />

        <View
          onLayout={(e) => {
            sectionY.current.survey = e.nativeEvent.layout.y;
          }}
        >
          <SurveySection
            handleAnswerSurvey={handleAnswerSurvey}
            sendingSurvey={sendingSurvey}
            surveyError={surveyError}
            surveyResponses={surveyResponses}
            surveys={surveys}
            surveysLoading={surveysLoading}
          />
        </View>

        <View
          onLayout={(e) => {
            sectionY.current.community = e.nativeEvent.layout.y;
          }}
        >
          <WeeklyEventsSection
            attendance={attendance}
            error={eventsError}
            events={events}
            eventsLoading={eventsLoading}
            onSubmitAttendance={handleRegisterAttendance}
            submittingAttendance={submittingAttendance}
          />
        </View>

        <View
          onLayout={(e) => {
            sectionY.current.reports = e.nativeEvent.layout.y;
          }}
        >
          <ReportForm
            coords={coords}
            description={description}
            handleCancelReport={handleCancelReport}
            handleSubmitReport={handleSubmitReport}
            locationLoading={locationLoading}
            locationText={locationText}
            pickPhoto={pickPhoto}
            photoUri={photoUri}
            problemType={problemType}
            requestCoords={requestCoords}
            setDescription={setDescription}
            setLocationText={setLocationText}
            setProblemType={(value) => setProblemType(value)}
            submittingReport={submittingReport}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
