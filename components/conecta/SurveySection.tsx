import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { conectaStyles as styles } from "@/styles/conectaStyles";
import type { Survey } from "@/hooks/conecta/useSurveys";

interface SurveySectionProps {
  handleAnswerSurvey: (surveyId: string, answer: string) => Promise<void>;
  sendingSurvey: Record<string, boolean>;
  surveyError: string | null;
  surveyResponses: Record<string, string>;
  surveys: Survey[];
  surveysLoading: boolean;
}

export const SurveySection = ({
  handleAnswerSurvey,
  sendingSurvey,
  surveyError,
  surveyResponses,
  surveys,
  surveysLoading,
}: SurveySectionProps) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Encuestas</Text>
      <Text style={styles.sectionPill}>Activas</Text>
    </View>
    <Text style={styles.sectionDescription}>
      Tu opinión ayuda a priorizar mejoras. Responde una sola vez por encuesta.
    </Text>

    {surveysLoading && (
      <View style={styles.centerRow}>
        <ActivityIndicator color="#0A2240" />
        <Text style={styles.infoText}>Cargando encuestas...</Text>
      </View>
    )}

    {surveyError && <Text style={styles.errorText}>{surveyError}</Text>}

    {!surveysLoading && !surveys.length && !surveyError && (
      <Text style={styles.infoText}>
        No hay encuestas activas en este momento.
      </Text>
    )}

    {surveys.map((survey) => (
      <View key={survey.id} style={styles.surveyCard}>
        <Text style={styles.surveyTitle}>{survey.title}</Text>
        <Text style={styles.surveyQuestion}>{survey.question}</Text>

        <View style={styles.optionsGrid}>
          {survey.options.map((option) => {
            const isSelected = surveyResponses[survey.id] === option;
            const isSending = sendingSurvey[survey.id];

            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected,
                ]}
                disabled={isSelected || isSending}
                onPress={() => handleAnswerSurvey(survey.id, option)}
              >
                {isSelected && (
                  <Text
                    style={[
                      styles.optionText,
                      styles.optionCheck,
                      styles.optionTextSelected,
                    ]}
                  >
                    ✔
                  </Text>
                )}
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {surveyResponses[survey.id] && (
          <Text style={styles.answerSaved}>
            Respuesta guardada: {surveyResponses[survey.id]}
          </Text>
        )}
      </View>
    ))}
  </View>
);
