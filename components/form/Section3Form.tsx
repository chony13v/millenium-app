import React from 'react';
import { View, Text, Button, TouchableOpacity, Alert } from 'react-native';
import Checkbox from 'expo-checkbox';

interface Section3FormProps {
  consentimientoParticipacion: boolean;
  autorizacionFotos: boolean;
  acuerdoPrivacidad: boolean;
  errors: {
    consentimientoParticipacion?: string;
    autorizacionFotos?: string;
    acuerdoPrivacidad?: string;
  };
  setConsentimientoParticipacion: (value: boolean) => void;
  setAutorizacionFotos: (value: boolean) => void;
  setAcuerdoPrivacidad: (value: boolean) => void;
  setTermsModalVisible: (value: boolean) => void;
  setPrivacyModalVisible: (value: boolean) => void;
  handlePreviousSection: () => void;
  validateSection3: () => boolean;
  saveProfile: () => void;
}

const Section3Form: React.FC<Section3FormProps> = ({
  consentimientoParticipacion,
  autorizacionFotos,
  acuerdoPrivacidad,
  errors,
  setConsentimientoParticipacion,
  setAutorizacionFotos,
  setAcuerdoPrivacidad,
  setTermsModalVisible,
  setPrivacyModalVisible,
  handlePreviousSection,
  validateSection3,
  saveProfile,
}) => {
  const handleFinalize = () => {
    if (validateSection3()) {
      saveProfile();
    } else {
      const missingConsents = [];
      if (!consentimientoParticipacion) {
        missingConsents.push('• Consentimiento de participación');
      }
      if (!autorizacionFotos) {
        missingConsents.push('• Autorización de uso de fotos y videos');
      }
      if (!acuerdoPrivacidad) {
        missingConsents.push('• Acuerdo de política de privacidad');
      }

      Alert.alert(
        'Consentimientos Requeridos',
        'Por favor acepta todos los consentimientos para continuar:\n\n' + missingConsents.join('\n')
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Sección 3: {'\n'}Consentimiento y Acuerdos
      </Text>

      <View style={{ marginVertical: 15 }} />

      <View style={styles.contentContainer}>
        <View style={styles.checkboxContainer}>
          <Checkbox
            value={consentimientoParticipacion}
            onValueChange={setConsentimientoParticipacion}
            color={consentimientoParticipacion ? '#4630EB' : '#1a1a1a'}
          />
          <View style={styles.checkboxWrapper}>
            <Text style={styles.regularText}>
              Yo, el padre/tutor, doy mi consentimiento para la participación de mi hijo en el torneo y reconozco los{' '}
            </Text>
            <TouchableOpacity onPress={() => setTermsModalVisible(true)}>
              <Text style={styles.linkText}>términos y condiciones</Text>
            </TouchableOpacity>
            <Text style={styles.regularText}>.</Text>
          </View>
        </View>
        {errors.consentimientoParticipacion && (
          <Text style={styles.errorText}>{errors.consentimientoParticipacion}</Text>
        )}

        <View style={styles.divider} />

        <View style={styles.checkboxContainer}>
          <Checkbox
            value={autorizacionFotos}
            onValueChange={setAutorizacionFotos}
            color={autorizacionFotos ? '#4630EB' : '#1a1a1a'}
          />
          <Text style={[styles.regularText, { marginLeft: 10, flex: 1 }]}>
            Autorizo el uso de fotos y videos de mi hijo durante el torneo para fines promocionales.
          </Text>
        </View>
        {errors.autorizacionFotos && (
          <Text style={styles.errorText}>{errors.autorizacionFotos}</Text>
        )}

        <View style={styles.divider} />

        <View style={styles.checkboxContainer}>
          <Checkbox
            value={acuerdoPrivacidad}
            onValueChange={setAcuerdoPrivacidad}
            color={acuerdoPrivacidad ? '#4630EB' : '#1a1a1a'}
          />
          <View style={styles.checkboxWrapper}>
            <Text style={styles.regularText}>Acepto la </Text>
            <TouchableOpacity onPress={() => setPrivacyModalVisible(true)}>
              <Text style={styles.linkText}>política de privacidad</Text>
            </TouchableOpacity>
            <Text style={styles.regularText}> y el manejo de datos personales.</Text>
          </View>
        </View>
        {errors.acuerdoPrivacidad && (
          <Text style={styles.errorText}>{errors.acuerdoPrivacidad}</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button title="← Anterior" onPress={handlePreviousSection} color="#4630EB" />
        <View style={styles.buttonSeparator} />
        <Button title="Finalizar" onPress={handleFinalize} color="#4630EB" />
      </View>
    </View>
  );
};

const styles = {
  container: {
    width: '100%' as const,
    flexDirection: 'column' as const,
    alignItems: 'flex-start' as const,
  },
  header: {
    fontFamily: 'barlow-regular',
    fontSize: 20,
    padding: 5,
    marginBottom: -20,
  },
  contentContainer: {
    width: '100%' as const,
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  checkboxWrapper: {
    flexDirection: 'row' as const,
    flex: 1,
    flexWrap: 'wrap' as const,
    marginLeft: 10,
  },
  regularText: {
    fontFamily: 'barlow-medium',
    color: '#1a1a1a',
  },
  linkText: {
    fontFamily: 'barlow-medium',
    textDecorationLine: 'underline' as const,
    color: '#4630EB',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontFamily: 'barlow-regular',
  },
  divider: {
    borderBottomColor: '#1a1a1a',
    borderBottomWidth: 1,
    marginVertical: 15,
  },
  buttonContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 20,
    width: '100%' as const,
  },
  buttonSeparator: {
    height: 20,
    width: 1,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 10,
  },
};


export default Section3Form;