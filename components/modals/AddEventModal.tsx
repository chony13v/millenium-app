import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { Colors } from "@/constants/Colors";
import ModalSelector from "react-native-modal-selector";
import { CITY_OPTIONS, type CityId } from "@/constants/cities";
import { MaskedTextInput } from "react-native-mask-text";

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  mode?: "add" | "edit";
  initialEvent?: {
    id: string;
    date: string;        // Esperado en Firestore como YYYY-MM-DD
    time: string;        // HH:MM (24h)
    description: string;
    cityId?: CityId;
  };
  cityId?: CityId | null;
}

export default function AddEventModal({
  visible,
  onClose,
  onSave,
  mode = "add",
  initialEvent,
  cityId,
}: AddEventModalProps) {
  const [eventData, setEventData] = useState({
    date: "",            // aquí lo manejamos como DD/MM/AAAA en UI
    time: "",
    description: "",
    cityId: (cityId ?? "") as CityId | "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const citySelectorOptions = useMemo(
    () =>
      CITY_OPTIONS.map((option, index) => ({
        key: index,
        label: option.title,
        value: option.id,
      })),
    []
  );

  /** ───────────── Helpers de fecha y hora ───────────── */

  const ddmmyyyyFromISO = (iso: string): string => {
    // ISO esperado: YYYY-MM-DD
    const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return iso ?? "";
    const [, yyyy, mm, dd] = m;
    return `${dd}/${mm}/${yyyy}`;
  };

  const isoFromDDMMYYYY = (ddmmyyyy: string): string | null => {
    const m = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const [, dd, mm, yyyy] = m;

    // Validación de calendario básica
    const day = Number(dd);
    const month = Number(mm);
    const year = Number(yyyy);
    if (month < 1 || month > 12) return null;

    const lastDay = new Date(year, month, 0).getDate(); // día 0 del siguiente mes = último día del actual
    if (day < 1 || day > lastDay) return null;

    return `${yyyy}-${mm}-${dd}`;
  };

  const isValidTime = (hhmm: string): boolean => {
    // 24h, permite 00:00 a 23:59
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(hhmm);
  };

  /** ───────────── Carga/Reset según modo ───────────── */

  useEffect(() => {
    if (mode === "edit" && initialEvent) {
      setEventData({
        date: initialEvent.date ? ddmmyyyyFromISO(initialEvent.date) : "",
        time: initialEvent.time ?? "",
        description: initialEvent.description ?? "",
        cityId: initialEvent.cityId ?? ((cityId ?? "") as CityId | ""),
      });
    } else {
      setEventData({
        date: "",
        time: "",
        description: "",
        cityId: (cityId ?? "") as CityId | "",
      });
    }
  }, [visible, mode, initialEvent, cityId]);

  /** ───────────── Guardado ───────────── */

  const handleSave = async () => {
    // Validaciones
    const isoDate = isoFromDDMMYYYY(eventData.date);
    if (!isoDate) {
      Alert.alert("Fecha inválida", "Usa el formato DD/MM/AAAA (p. ej. 01/04/2025).");
      return;
    }
    if (!isValidTime(eventData.time)) {
      Alert.alert("Hora inválida", "Usa el formato 24 horas HH:MM (p. ej. 08:30 o 14:05).");
      return;
    }
    if (!eventData.description || !eventData.cityId) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        date: isoDate,                 // Guardamos normalizado en YYYY-MM-DD
        time: eventData.time,
        description: eventData.description.trim(),
        cityId: eventData.cityId,
      };

      if (mode === "edit" && initialEvent?.id) {
        await updateDoc(doc(db, "GlobalEvents", initialEvent.id), payload);
        Alert.alert("Éxito", "Evento actualizado correctamente");
      } else {
        await addDoc(collection(db, "GlobalEvents"), {
          ...payload,
          createdAt: new Date(),
        });
        Alert.alert("Éxito", "Evento guardado correctamente");
      }

      setEventData({
        date: "",
        time: "",
        description: "",
        cityId: (cityId ?? "") as CityId | "",
      });
      onClose();
      onSave();
    } catch (error) {
      console.error("Error al guardar el evento:", error);
      Alert.alert("Error", "No se pudo guardar el evento");
    } finally {
      setIsSaving(false);
    }
  };

  /** ───────────── Eliminación ───────────── */

  const handleDelete = async () => {
    if (!initialEvent?.id) return;

    Alert.alert(
      "Eliminar Evento",
      "¿Estás seguro de que deseas eliminar este evento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "GlobalEvents", initialEvent.id));
              Alert.alert("Éxito", "Evento eliminado correctamente");
              onClose();
              onSave();
            } catch (error) {
              console.error("Error al eliminar el evento:", error);
              Alert.alert("Error", "No se pudo eliminar el evento");
            }
          },
        },
      ]
    );
  };

  /** ───────────── Render ───────────── */

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalView}>
        <Text style={styles.modalTitle}>
          {mode === "edit" ? "Editar Evento Global" : "Agregar Evento Global"}
        </Text>

        <ModalSelector
          data={citySelectorOptions}
          onChange={(option) =>
            setEventData((prev) => ({
              ...prev,
              cityId: option.value as CityId,
            }))
          }
          cancelText="Cerrar"
          initValue="Selecciona una ciudad"
          style={styles.selectorContainer}
        >
          <TextInput
            style={styles.input}
            placeholder="Selecciona una ciudad"
            placeholderTextColor="#666"
            editable={false}
            value={
              eventData.cityId
                ? CITY_OPTIONS.find((option) => option.id === eventData.cityId)?.title ?? ""
                : ""
            }
          />
        </ModalSelector>

        {/* Fecha con máscara DD/MM/AAAA */}
        <MaskedTextInput
          mask="99/99/9999"
          placeholder="DD/MM/AAAA"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          value={eventData.date}
          onChangeText={(text) =>
            setEventData((prev) => ({ ...prev, date: text }))
          }
          style={styles.input}
        />

        {/* Hora con máscara HH:MM (24h) */}
        <MaskedTextInput
          mask="99:99"
          placeholder="__:__"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          value={eventData.time}
          onChangeText={(text) =>
            setEventData((prev) => ({ ...prev, time: text }))
          }
          style={styles.input}
        />

        <TextInput
          style={styles.input}
          placeholder="Descripción"
          placeholderTextColor="#666"
          value={eventData.description}
          onChangeText={(text) =>
            setEventData((prev) => ({ ...prev, description: text }))
          }
        />

        <View style={styles.modalButtons}>
          {mode === "edit" && (
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={handleDelete}
              disabled={isSaving}
            >
              <Text style={styles.buttonText}>Eliminar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={isSaving}
          >
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              isSaving && styles.saveButtonSaving,
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  selectorContainer: {
    width: "100%",
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 8,
  },
  button: {
    padding: 10,
    borderRadius: 10,
    flexGrow: 1,
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
  deleteButton: {
    backgroundColor: "#D32F2F",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontFamily: "barlow-semibold",
  },
});
