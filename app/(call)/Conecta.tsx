import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { db, app } from "@/config/FirebaseConfig";
import { useCitySelection } from "@/hooks/useCitySelection";
import type { CityId } from "@/constants/cities";

type Survey = {
  id: string;
  title: string;
  question: string;
  options: string[];
  cityId?: CityId | "all";
};

type ProblemType =
  | "basura"
  | "huecos"
  | "alumbrado"
  | "infraestructura"
  | "seguridad"
  | "otros";

const PROBLEM_TYPES: { id: ProblemType; label: string }[] = [
  { id: "basura", label: "Basura" },
  { id: "huecos", label: "Huecos" },
  { id: "alumbrado", label: "Alumbrado" },
  { id: "infraestructura", label: "Infraestructura" },
  { id: "seguridad", label: "Seguridad" },
  { id: "otros", label: "Otros" },
];

const FALLBACK_SURVEY: Survey = {
  id: "beca-deportiva",
  title: "¿Dónde quisieras una beca deportiva?",
  question: "Elige el país donde te gustaría acceder a una beca deportiva.",
  options: ["Ecuador", "Colombia", "Argentina"],
  cityId: "all",
};

const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3 MB
const OFFENSIVE_WORDS = [
  "puta",
  "puto",
  "mierda",
  "pendejo",
  "pendeja",
  "estupido",
  "estupida",
  "idiota",
  "imbecil",
  "imbécil",
  "cabrón",
  "cabron",
  "gilipollas",
  "malparido",
  "malparida",
  "hijo de puta",
  "conchetumadre",
  "chinga",
  "chingar",
  "verga",
  "coño",
  "pelotudo",
  "boludo",
];

export default function Conecta() {
  const { user } = useUser();
  const { selectedCity, hasHydrated } = useCitySelection();
  const router = useRouter();

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<
    Record<string, string>
  >({});
  const [surveysLoading, setSurveysLoading] = useState(false);
  const [surveyError, setSurveyError] = useState<string | null>(null);
  const [sendingSurvey, setSendingSurvey] = useState<Record<string, boolean>>(
    {}
  );

  const [problemType, setProblemType] = useState<ProblemType | null>(null);
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const storage = useMemo(() => getStorage(app), []);

  const fetchSurveys = useCallback(async () => {
    if (!hasHydrated) return;

    setSurveysLoading(true);
    setSurveyError(null);

    try {
      const q = query(collection(db, "surveys"), where("isActive", "==", true));
      const snapshot = await getDocs(q);
      const list: Survey[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Partial<Survey>;
        const targetCity = data.cityId as CityId | "all" | undefined;

        if (
          !selectedCity ||
          !targetCity ||
          targetCity === selectedCity ||
          targetCity === "all"
        ) {
          list.push({
            id: docSnap.id,
            title: data.title ?? "Encuesta",
            question: data.question ?? "¿Qué opinas?",
            options: Array.isArray(data.options) ? data.options : [],
            cityId: data.cityId,
          });
        }
      });

      const alreadyIncluded = list.some((s) => s.id === FALLBACK_SURVEY.id);
      const finalList = alreadyIncluded ? list : [...list, FALLBACK_SURVEY];

      setSurveys(finalList);
    } catch (error) {
      console.error("Error cargando encuestas", error);
      setSurveyError("No pudimos cargar las encuestas ahora.");
    } finally {
      setSurveysLoading(false);
    }
  }, [hasHydrated, selectedCity]);

  const fetchUserResponses = useCallback(async () => {
    if (!user?.id) return;

    try {
      const q = query(
        collection(db, "surveyResponses"),
        where("userId", "==", user.id)
      );
      const snapshot = await getDocs(q);
      const responses: Record<string, string> = {};

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as { surveyId?: string; answer?: string };
        if (data.surveyId && data.answer) {
          responses[data.surveyId] = data.answer;
        }
      });

      setSurveyResponses(responses);
    } catch (error) {
      console.error("Error cargando respuestas", error);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchSurveys();
  }, [fetchSurveys]);

  useEffect(() => {
    void fetchUserResponses();
  }, [fetchUserResponses]);

  const processPhoto = useCallback(async (uri: string) => {
    // Reduce tamaño y calidad para mantener el archivo bajo 3MB
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1600 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );

    const resp = await fetch(manipulated.uri);
    const blob = await resp.blob();

    if (blob.size > MAX_PHOTO_BYTES) {
      Alert.alert(
        "Imagen muy pesada",
        "La foto supera los 3 MB. Reduce la resolución o toma otra."
      );
      return null;
    }

    return manipulated.uri;
  }, []);

  const normalizeText = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const hasOffensiveWords = (text: string) => {
    const normalized = normalizeText(text);
    const tokens = normalized.replace(/[^a-zñáéíóúü\s]/gi, " ").split(/\s+/);
    return OFFENSIVE_WORDS.some((word) => tokens.includes(word));
  };

  const isMeaninglessText = (text: string) => {
    const normalized = normalizeText(text);
    const compact = normalized.replace(/[^a-z]/g, "");

    // Patrones obvios de relleno
    const fillerPatterns = /(asdf|qwer|zxcv|aaaaa|eeee|oooo|mmmm)/;
    if (fillerPatterns.test(compact)) return true;

    // Si todos los caracteres son iguales y hay al menos 5
    if (compact.length >= 5 && new Set(compact.split("")).size === 1) {
      return true;
    }

    return false;
  };

  const validateDescription = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 10) return false;

    const letterMatches = trimmed.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g);
    const letterCount = letterMatches ? letterMatches.length : 0;
    if (letterCount === 0) return false;

    const nonAlphaRatio = (trimmed.length - letterCount) / trimmed.length;
    if (nonAlphaRatio > 0.4) return false;

    if (hasOffensiveWords(trimmed)) return false;
    if (isMeaninglessText(trimmed)) return false;

    return true;
  };

  const handleAnswerSurvey = async (surveyId: string, answer: string) => {
    if (!user?.id) {
      Alert.alert(
        "Inicia sesión",
        "Necesitas una sesión activa para responder."
      );
      return;
    }

    if (!selectedCity) {
      Alert.alert(
        "Selecciona un proyecto",
        "Debes elegir una ciudad antes de responder."
      );
      return;
    }

    if (surveyResponses[surveyId]) {
      Alert.alert("Gracias", "Ya registramos tu respuesta para esta encuesta.");
      return;
    }

    setSendingSurvey((prev) => ({ ...prev, [surveyId]: true }));

    try {
      await addDoc(collection(db, "surveyResponses"), {
        surveyId,
        answer,
        userId: user.id,
        cityId: selectedCity,
        createdAt: serverTimestamp(),
      });

      setSurveyResponses((prev) => ({ ...prev, [surveyId]: answer }));
      Alert.alert("Respuesta enviada", "Gracias por participar.");
    } catch (error) {
      console.error("Error guardando respuesta", error);
      Alert.alert("No pudimos guardar", "Intenta nuevamente en unos segundos.");
    } finally {
      setSendingSurvey((prev) => ({ ...prev, [surveyId]: false }));
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a tus fotos para adjuntar una imagen."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const processed = await processPhoto(result.assets[0].uri);
      if (processed) {
        setPhotoUri(processed);
      }
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permiso de cámara",
        "Autoriza la cámara para tomar una foto."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const processed = await processPhoto(result.assets[0].uri);
      if (processed) {
        setPhotoUri(processed);
      }
    }
  };

  const pickPhoto = () => {
    Alert.alert("Adjuntar foto", "Elige cómo agregar la imagen", [
      { text: "Cámara", onPress: () => void takePhoto() },
      { text: "Galería", onPress: () => void pickFromLibrary() },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const requestCoords = async () => {
    setLocationLoading(true);
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          "Activa ubicación",
          "Habilita la ubicación para enviar el reporte con coordenadas."
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso de ubicación",
          "Necesitamos permiso de ubicación para adjuntar coordenadas."
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      console.error("Error obteniendo coordenadas", error);
      Alert.alert(
        "Ubicación no disponible",
        "No pudimos obtener tu ubicación. Intenta de nuevo."
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const uploadPhotoIfNeeded = async () => {
    if (!photoUri) return null;

    const response = await fetch(photoUri);
    const blob = await response.blob();

    const extension = photoUri.split(".").pop() ?? "jpg";
    const safeUser = user?.id ?? "anon";
    const storageRef = ref(
      storage,
      `reports/${safeUser}/${Date.now()}.${extension}`
    );

    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  const handleSubmitReport = async () => {
    if (!user?.id) {
      Alert.alert(
        "Inicia sesión",
        "Necesitas estar autenticado para reportar."
      );
      return;
    }

    if (!selectedCity) {
      Alert.alert(
        "Selecciona un proyecto",
        "Elige una ciudad para enviar el reporte."
      );
      return;
    }

    if (
      !problemType ||
      !description.trim() ||
      !locationText.trim() ||
      !validateDescription(description)
    ) {
      Alert.alert(
        "Completa los campos",
        "Por favor completa todos los campos y asegúrate de que tu mensaje sea claro y respetuoso."
      );
      return;
    }

    if (!coords) {
      Alert.alert(
        "Ubicación requerida",
        "Obtén tu ubicación antes de enviar para guardar las coordenadas."
      );
      return;
    }

    setSubmittingReport(true);

    try {
      const photoUrl = await uploadPhotoIfNeeded();

      const coordsPayload = coords
        ? { latitude: coords.latitude, longitude: coords.longitude }
        : null;

      await addDoc(collection(db, "cityReports"), {
        problemType,
        description: description.trim(),
        locationText: locationText.trim(),
        coords: coordsPayload,
        photoUrl: photoUrl ?? null,
        userId: user.id,
        cityId: selectedCity,
        status: "pendiente",
        createdAt: serverTimestamp(),
      });

      setProblemType(null);
      setDescription("");
      setLocationText("");
      setCoords(null);
      setPhotoUri(null);

      Alert.alert(
        "Reporte enviado",
        "Gracias por ayudarnos a mejorar la ciudad."
      );
    } catch (error) {
      console.error("Error enviando reporte", error);
      Alert.alert(
        "No pudimos enviar",
        "Intenta nuevamente, puede que no haya conexión."
      );
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleCancelReport = () => {
    Alert.alert("Cancelar reporte", "¿Descartar y volver al inicio?", [
      { text: "Seguir aquí", style: "cancel" },
      {
        text: "Sí, cancelar",
        style: "destructive",
        onPress: () => {
          setProblemType(null);
          setDescription("");
          setLocationText("");
          setCoords(null);
          setPhotoUri(null);
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
        <Text style={styles.screenTitle}>Ciudad FC</Text>
        <Text style={styles.screenSubtitle}>
          Participa y vive el deporte en tu ciudad con Ciudad FC: encuestas
          rápidas y reportes ciudadanos para mejorar cada cancha.
        </Text>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Encuestas</Text>
            <Text style={styles.sectionPill}>Activas</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Tu opinión ayuda a priorizar mejoras. Responde una sola vez por
            encuesta.
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
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {isSelected ? "✔ " : ""}
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

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reportes ciudadanos</Text>
            <Text style={[styles.sectionPill, styles.pillOrange]}>Nuevo</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Cuéntanos qué ocurre en tu cancha o en los espacios deportivos
            cercanos. Tu reporte ayuda al municipio a mantener y mejorar las
            zonas donde entrenamos y jugamos.
          </Text>
          <Text style={styles.hintText}>Peso máximo de la foto: 3 MB.</Text>

          <View style={styles.chipsContainer}>
            {PROBLEM_TYPES.map((type) => {
              const isSelected = problemType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.chip,
                    isSelected && styles.chipSelected,
                    submittingReport && styles.chipDisabled,
                  ]}
                  onPress={() => setProblemType(type.id)}
                  disabled={submittingReport}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            placeholder="Ejemplo: el arco está roto, no funciona la luz en la cancha, hay basura en el área, o faltan redes."
            placeholderTextColor="#94a3b8"
            editable={!submittingReport}
          />

          <Text style={styles.inputLabel}>Ubicación (referencia)</Text>
          <TextInput
            style={styles.input}
            value={locationText}
            onChangeText={setLocationText}
            placeholder="Ej: Calle 10 y Av. Central, frente al parque"
            placeholderTextColor="#94a3b8"
            editable={!submittingReport}
          />

          <View style={styles.locationRow}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                locationLoading && styles.buttonDisabled,
              ]}
              onPress={requestCoords}
              disabled={locationLoading || submittingReport}
            >
              {locationLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>Obtener ubicación</Text>
              )}
            </TouchableOpacity>
            <View style={styles.coordsBadge}>
              <Text style={styles.coordsText}>
                {coords
                  ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(
                      4
                    )}`
                  : "Sin coordenadas"}
              </Text>
            </View>
          </View>

          <View style={styles.photoRow}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                submittingReport && styles.buttonDisabled,
              ]}
              onPress={pickPhoto}
              disabled={submittingReport}
            >
              <Text style={styles.secondaryButtonText}>
                Agregar foto (opcional)
              </Text>
            </TouchableOpacity>
            {photoUri && (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              submittingReport && styles.buttonDisabled,
            ]}
            onPress={handleSubmitReport}
            disabled={submittingReport}
          >
            {submittingReport ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Enviar reporte</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelReport}
            disabled={submittingReport}
          >
            <Text style={styles.cancelButtonText}>Cancelar y volver</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  screenTitle: {
    fontSize: 28,
    fontFamily: "barlow-medium",
    color: "#0A2240",
  },
  screenSubtitle: {
    fontSize: 16,
    fontFamily: "barlow-regular",
    color: "#475569",
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "barlow-medium",
    color: "#0A2240",
  },
  sectionPill: {
    backgroundColor: "#e0f2fe",
    color: "#0ea5e9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontFamily: "barlow-medium",
    fontSize: 12,
  },
  pillOrange: {
    backgroundColor: "#fff3e6",
    color: "#f97316",
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: "barlow-regular",
    color: "#475569",
    lineHeight: 20,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "barlow-regular",
    color: "#64748b",
  },
  hintText: {
    fontSize: 13,
    fontFamily: "barlow-regular",
    color: "#94a3b8",
  },
  errorText: {
    fontSize: 14,
    fontFamily: "barlow-regular",
    color: "#ef4444",
  },
  surveyCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  surveyTitle: {
    fontSize: 16,
    fontFamily: "barlow-medium",
    color: "#0f172a",
  },
  surveyQuestion: {
    fontSize: 14,
    fontFamily: "barlow-regular",
    color: "#475569",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  optionButtonSelected: {
    backgroundColor: "#0ea5e9",
    borderColor: "#0ea5e9",
  },
  optionText: {
    fontSize: 14,
    fontFamily: "barlow-medium",
    color: "#0f172a",
  },
  optionTextSelected: {
    color: "white",
  },
  answerSaved: {
    fontSize: 13,
    fontFamily: "barlow-regular",
    color: "#16a34a",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: "#0ea5e9",
    borderColor: "#0ea5e9",
  },
  chipDisabled: {
    opacity: 0.7,
  },
  chipText: {
    fontSize: 14,
    fontFamily: "barlow-medium",
    color: "#0f172a",
  },
  chipTextSelected: {
    color: "white",
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "barlow-medium",
    color: "#0f172a",
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: "barlow-regular",
    color: "#0f172a",
    marginTop: 6,
    backgroundColor: "#f8fafc",
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  primaryButtonText: {
    color: "white",
    fontFamily: "barlow-medium",
    fontSize: 15,
  },
  coordsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  coordsText: {
    fontSize: 13,
    fontFamily: "barlow-regular",
    color: "#0f172a",
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#0ea5e9",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontFamily: "barlow-medium",
    color: "#0ea5e9",
    fontSize: 15,
  },
  photoPreview: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  submitButton: {
    marginTop: 14,
    backgroundColor: "#0A2240",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontFamily: "barlow-medium",
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    color: "#0f172a",
    fontFamily: "barlow-medium",
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
