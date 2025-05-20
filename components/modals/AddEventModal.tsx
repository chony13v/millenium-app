// AddEventModal.tsx
import React, { useEffect, useState } from "react";
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
import { addDoc, collection, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { Colors } from "@/constants/Colors";

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  mode?: "add" | "edit";
  initialEvent?: {
    id: string;
    date: string;
    time: string;
    description: string;
  };
}

export default function AddEventModal({
  visible,
  onClose,
  onSave,
  mode = "add",
  initialEvent,
}: AddEventModalProps) {
  const [eventData, setEventData] = useState({ date: "", time: "", description: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initialEvent) {
      setEventData({
        date: initialEvent.date,
        time: initialEvent.time,
        description: initialEvent.description,
      });
    } else {
      setEventData({ date: "", time: "", description: "" });
    }
  }, [visible, mode, initialEvent]);

  const handleSave = async () => {
    if (!eventData.date || !eventData.time || !eventData.description) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    setIsSaving(true);
    try {
      if (mode === "edit" && initialEvent?.id) {
        await updateDoc(doc(db, "GlobalEvents", initialEvent.id), {
          ...eventData,
        });
        Alert.alert("Éxito", "Evento actualizado correctamente");
      } else {
        await addDoc(collection(db, "GlobalEvents"), {
          ...eventData,
          createdAt: new Date(),
        });
        Alert.alert("Éxito", "Evento guardado correctamente");
      }

      setEventData({ date: "", time: "", description: "" });
      onClose();
      onSave();
    } catch (error) {
      console.error("Error al guardar el evento:", error);
      Alert.alert("Error", "No se pudo guardar el evento");
    } finally {
      setIsSaving(false);
    }
  };

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
        <TextInput
          style={styles.input}
          placeholder="Fecha (YYYY-MM-DD)"
          value={eventData.date}
          onChangeText={(text) => setEventData({ ...eventData, date: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Hora (HH:MM)"
          value={eventData.time}
          onChangeText={(text) => setEventData({ ...eventData, time: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Descripción"
          value={eventData.description}
          onChangeText={(text) => setEventData({ ...eventData, description: text })}
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
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton, isSaving && styles.saveButtonSaving]}
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
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    padding: 10,
    borderRadius: 10,
    width: "30%",
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
