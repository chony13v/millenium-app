import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/config/FirebaseConfig';

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onEventAdded: () => void;
}

export default function AddEventModal({ visible, onClose, onEventAdded }: AddEventModalProps) {
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  const handleAddEvent = async () => {
    try {
      await addDoc(collection(db, 'GlobalEvents'), {
        date,
        description,
      });
      setDate('');
      setDescription('');
      onEventAdded();
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el evento');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Agregar Evento</Text>
          <TextInput
            style={styles.input}
            placeholder="Fecha"
            value={date}
            onChangeText={setDate}
          />
          <TextInput
            style={styles.input}
            placeholder="Descripción"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <View style={styles.buttonContainer}>
            <Button title="Cancelar" onPress={onClose} />
            <Button title="Agregar" onPress={handleAddEvent} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'outfit-bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
});