import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { PROBLEM_TYPES } from "@/constants/reportProblems";
import type { ProblemType } from "@/types/reports";
import { conectaStyles as styles } from "@/styles/conectaStyles";

interface ReportFormProps {
  coords: { latitude: number; longitude: number } | null;
  description: string;
  handleCancelReport: () => void;
  handleSubmitReport: () => Promise<void>;
  locationLoading: boolean;
  locationText: string;
  pickPhoto: () => void;
  photoUri: string | null;
  problemType: ProblemType | null;
  requestCoords: () => Promise<void>;
  setDescription: (value: string) => void;
  setLocationText: (value: string) => void;
  setProblemType: (value: ProblemType) => void;
  submittingReport: boolean;
}

export const ReportForm = ({
  coords,
  description,
  handleCancelReport,
  handleSubmitReport,
  locationLoading,
  locationText,
  pickPhoto,
  photoUri,
  problemType,
  requestCoords,
  setDescription,
  setLocationText,
  setProblemType,
  submittingReport,
}: ReportFormProps) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Reportes ciudadanos</Text>
      <Text style={[styles.sectionPill, styles.sectionPillOrange]}>Nuevo</Text>
    </View>
    <Text style={styles.sectionDescription}>
      Cuéntanos qué ocurre en tu cancha o en los espacios deportivos cercanos.
      Tu reporte ayuda al municipio a mantener y mejorar las zonas donde
      entrenamos y jugamos.
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
              style={[styles.chipText, isSelected && styles.chipTextSelected]}
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
        style={[styles.primaryButton, locationLoading && styles.buttonDisabled]}
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
            ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
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
        <Text style={styles.secondaryButtonText}>Agregar foto (opcional)</Text>
      </TouchableOpacity>
      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.photoPreview} />
      )}
    </View>

    <TouchableOpacity
      style={[styles.submitButton, submittingReport && styles.buttonDisabled]}
      onPress={handleSubmitReport}
      disabled={submittingReport}
    >
      <Text style={styles.submitButtonText}>
        {submittingReport ? "Enviando..." : "Enviar reporte"}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.cancelButton}
      onPress={handleCancelReport}
      disabled={submittingReport}
    >
      <Text style={styles.cancelButtonText}>Cancelar y volver</Text>
    </TouchableOpacity>
  </View>
);
