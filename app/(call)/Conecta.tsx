import React, { useMemo } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { getStorage } from "firebase/storage";

import { conectaStyles as styles } from "./Conecta.styles";
import { HeroCard } from "@/components/conecta/HeroCard";
import { ReportForm } from "@/components/conecta/ReportForm";
import { SurveySection } from "@/components/conecta/SurveySection";
import { app } from "@/config/FirebaseConfig";
import { useCitySelection } from "@/hooks/useCitySelection";
import { useReportForm } from "@/hooks/conecta/useReportForm";
import { useSurveys } from "@/hooks/conecta/useSurveys";

export default function Conecta() {
  const { user } = useUser();
  const { selectedCity, hasHydrated } = useCitySelection();
  const router = useRouter();

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
    userId: user?.id,
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
  } = useReportForm({ selectedCity, storage, userId: user?.id });

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
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HeroCard />

        <SurveySection
          handleAnswerSurvey={handleAnswerSurvey}
          sendingSurvey={sendingSurvey}
          surveyError={surveyError}
          surveyResponses={surveyResponses}
          surveys={surveys}
          surveysLoading={surveysLoading}
        />

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
