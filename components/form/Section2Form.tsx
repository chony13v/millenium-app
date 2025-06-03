import React, {useRef, useEffect} from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import ModalSelector from 'react-native-modal-selector';

interface Section2FormProps {
  parentFullName: string;
  relationship: string;
  parentPhoneNumber: string;
  parentEmail: string;
  errors: any;
  handleParentFullNameChange: (text: string) => void;
  handleRelationshipChange: (option: { key: string; label: string }) => void;
  handleParentPhoneNumberChange: (text: string) => void;
  handleParentEmailChange: (text: string) => void;
  handlePreviousSection: () => void;
  validateAndNext: () => void;
}

const Section2Form: React.FC<Section2FormProps> = ({
  parentFullName,
  relationship,
  parentPhoneNumber,
  parentEmail,
  errors,
  handleParentFullNameChange,
  handleRelationshipChange,
  handleParentPhoneNumberChange,
  handleParentEmailChange,
  handlePreviousSection,
  validateAndNext
}) => {

  const parentFullNameRef = useRef<TextInput>(null);
  const relationshipRef = useRef<TextInput>(null);
  const parentPhoneNumberRef = useRef<TextInput>(null);
  const parentEmailRef = useRef<TextInput>(null);

  const relationshipOptions = [
    { key: 'Padre', label: 'Padre' },
    { key: 'Madre', label: 'Madre' },
    { key: 'Tutor Legal', label: 'Tutor Legal' },
    { key: 'Otro', label: 'Otro' },
  ];

  useEffect(() => {
    parentFullNameRef.current?.focus();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Sección 2: {'\n'}Información del Padre/Tutor
      </Text>

      <View style={{ marginVertical: 15 }} />

      <Text style={styles.label}>Nombre Completo del Padre/Madre/Tutor</Text>
      <TextInput
      ref={parentFullNameRef}
        placeholder="Nombre Completo del Padre/Tutor"
        placeholderTextColor="#666666"
        value={parentFullName}
        onChangeText={handleParentFullNameChange}
        style={[styles.input, {borderColor: errors.parentFullName ? 'red' : 'gray'}]}
        returnKeyType='next'
        onSubmitEditing={() => relationshipRef.current?.focus()}
      />
      {errors.parentFullName && <Text style={styles.errorText}>{errors.parentFullName}</Text>}

      <Text style={styles.label}>Relación con el Niño</Text>
      <ModalSelector
        data={relationshipOptions}
        initValue="Selecciona una relación"
        onChange={handleRelationshipChange}
        style={{ ...styles.modalSelectorContainer, marginBottom: errors.relationship ? 5 : 20 }}
      >
        <TextInput
        ref={relationshipRef}
          editable={false}
          placeholder="Escoje la relación"
          placeholderTextColor="#666666"
          value={relationship}
          style={[styles.input, {borderColor: errors.relationship ? 'red' : 'gray'}]}
        />
      </ModalSelector>
      {errors.relationship && <Text style={styles.errorText}>{errors.relationship}</Text>}

      <Text style={styles.label}>Número de Teléfono</Text>
      <TextInput
      ref={parentPhoneNumberRef}
        placeholder="Ej.: 0984706322"
        placeholderTextColor="#666666"
        value={parentPhoneNumber}
        onChangeText={handleParentPhoneNumberChange}
        keyboardType="numeric"
   
        style={[styles.input, {borderColor: 'gray'}]}
        returnKeyType='next'
        onSubmitEditing={() => parentEmailRef.current?.focus()}
      />

      <Text style={styles.label}>Correo Electrónico (Opcional)</Text>
      <TextInput
      ref={parentEmailRef}
        placeholder="Ej.: usuario@correo.com"
        placeholderTextColor="#666666"
        value={parentEmail}
        onChangeText={handleParentEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        style={[styles.input, {borderColor: errors.parentEmail ? 'red' : 'gray'}]}
        returnKeyType='done'
        onSubmitEditing={validateAndNext}
      />
      {errors.parentEmail && <Text style={styles.errorText}>{errors.parentEmail}</Text>}

      <View style={styles.buttonContainer}>
        <Button 
          title="← Anterior"
          onPress={handlePreviousSection}
          color="#4630EB"
        />
        <View style={styles.buttonSpacer} />
        <Button 
          title="Siguiente →"
          onPress={validateAndNext}
          color="#4630EB"
        />
      </View>
    </View>
  );
};

const styles = {
  container: {
    width: '100%' as const,
    flexDirection: 'column' as const,
  },
  header: {
    fontFamily: 'barlow-regular',
    fontSize: 20,
    padding: 5,
    marginBottom: -20,
  },
  label: {
    fontFamily: 'barlow-semibold',
    fontSize: 16,
    marginBottom: 10,
    color: '#2d2d2d',
    textAlign: 'left' as const,
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 12,
    width: '100%' as const,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    color: '#333333',
    borderRadius: 8,
    fontFamily: 'barlow-regular',
    textAlign: 'left' as const,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontFamily: 'barlow-regular',
  },
  buttonContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    marginTop: 20,
    width: '100%' as const,
  },
  buttonSpacer: {
    width: 20,
  },
  modalSelectorContainer: {
    width: '100%' as const,
    marginBottom: 20,
  }
};

export default Section2Form;