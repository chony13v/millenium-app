import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Colors } from '@/constants/Colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AboutModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Acerca de Millenium</Text>
          <Text style={styles.version}>Versión 1.1</Text>
          <Text style={styles.description}>
            Millenium App v1.1
            {'\n\n'}Tu plataforma integral para torneos selectivos y gestión deportiva.
            {'\n\n'}Características principales:
            {'\n'}• Gestión de torneos
            {'\n'}• Registro de jugadores
            {'\n'}• Estadísticas en tiempo real
            {'\n'}• Notificaciones personalizadas
            {'\n\n'}Desarrollado por Millenium Football Solutions
            {'\n'}© 2025 Millenium. Todos los derechos reservados.
            {'\n\n'}Contáctanos:
            {'\n'}info@milleniumgd.com
            {'\n'}www.milleniumfs.com
          </Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Cerrar</Text>
          </TouchableOpacity>
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
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  version: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.NAVY_BLUE,
    padding: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});