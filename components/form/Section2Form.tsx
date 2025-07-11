import React, { useRef, useEffect } from "react";
import { View, Text, TextInput, Button } from "react-native";
import ModalSelector from "react-native-modal-selector";

export interface Section2FormProps {
  parentFullName: string;
  relationship: string;
  economicSituation: string;                              
  parentPhoneNumber: string;
  parentEmail: string;
  errors: Partial<{
    parentFullName: string;
    relationship: string;
    economicSituation: string;                          
    parentEmail: string;
  }>;
  handleParentFullNameChange: (value: string) => void;
  handleRelationshipChange: (value: { key: string; label: string }) => void;
  handleEconomicSituationChange: (value: { key: string; label: string }) => void; 
  handleParentPhoneNumberChange: (value: string) => void;
  handleParentEmailChange: (value: string) => void;
  handlePreviousSection: () => void;
  validateAndNext: () => void;
}

const Section2Form: React.FC<Section2FormProps> = ({
  parentFullName,
  relationship,
  economicSituation,                  
  parentPhoneNumber,
  parentEmail,
  errors,
  handleParentFullNameChange,
  handleRelationshipChange,
  handleEconomicSituationChange,        
  handleParentPhoneNumberChange,
  handleParentEmailChange,
  handlePreviousSection,
  validateAndNext,
}) => {
  const parentFullNameRef = useRef<TextInput>(null);
  const relationshipRef = useRef<TextInput>(null);
  const economicSituationRef = useRef<TextInput>(null);   
  const parentPhoneRef = useRef<TextInput>(null);
  const parentEmailRef = useRef<TextInput>(null);

  const relationshipOptions = [
    { key: "Padre", label: "Padre" },
    { key: "Madre", label: "Madre" },
    { key: "Tutor Legal", label: "Tutor Legal" },
    { key: "Otro", label: "Otro" },
  ];

  const economicOptions = [                              
    { key: "Alta", label: "Alta\n(Puedo cubrir todos mis gastos)" },
    { key: "Media", label: "Media\n(Puedo cubrir mis gastos con limitaciones)" },
    { key: "Baja", label: "Baja\n(Tengo dificultades para cubrir gastos básicos como alimentación, salud o educación)" },
  ];

  useEffect(() => {
    parentFullNameRef.current?.focus();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sección 2: {"\n"}Información del Padre/Madre</Text>
      <View style={{ marginVertical: 15 }} />

      {/* Nombre */}
      <Text style={styles.label}>Nombre completo del Padre/Madre/Tutor</Text>
      <TextInput
        ref={parentFullNameRef}
        placeholder="Nombre completo"
        placeholderTextColor="#666"
        value={parentFullName}
        onChangeText={handleParentFullNameChange}
        style={[
          styles.input,
          { borderColor: errors.parentFullName ? "red" : "gray" },
        ]}
        returnKeyType="next"
        onSubmitEditing={() => relationshipRef.current?.focus()}
      />
      {errors.parentFullName && (
        <Text style={styles.errorText}>{errors.parentFullName}</Text>
      )}

      {/* Relación */}
      <Text style={styles.label}>Relación con el niño</Text>
      <ModalSelector
        data={relationshipOptions}
        initValue="Selecciona relación"
        onChange={(opt) => handleRelationshipChange(opt)}
        style={{
          ...styles.modalSelectorContainer,
          marginBottom: errors.relationship ? 5 : 20,
        }}
      >
        <TextInput
          ref={relationshipRef}
          editable={false}
          placeholder="Escoge la relación"
          placeholderTextColor="#666"
          value={relationship}
          style={[
            styles.input,
            { borderColor: errors.relationship ? "red" : "gray" },
          ]}
        />
      </ModalSelector>
      {errors.relationship && (
        <Text style={styles.errorText}>{errors.relationship}</Text>
      )}

      {/* Situación Económica (nuevo) */}
      <Text style={styles.label}>Situación económica actual</Text>
      <ModalSelector
        data={economicOptions}
        initValue="Selecciona situación"
        onChange={(opt) => handleEconomicSituationChange(opt)}
        style={{
          ...styles.modalSelectorContainer,
          marginBottom: errors.economicSituation ? 5 : 20,
        }}
      >
        <TextInput
          ref={economicSituationRef}
          editable={false}
          placeholder="Escoge situación económica"
          placeholderTextColor="#666"
          value={economicSituation}
          style={[
            styles.input,
            { borderColor: errors.economicSituation ? "red" : "gray" },
          ]}
        />
      </ModalSelector>
      {errors.economicSituation && (
        <Text style={styles.errorText}>{errors.economicSituation}</Text>
      )}

      {/* Teléfono */}
      <Text style={styles.label}>Número de teléfono</Text>
      <TextInput
        ref={parentPhoneRef}
        placeholder="0984706322"
        placeholderTextColor="#666"
        value={parentPhoneNumber}
        onChangeText={handleParentPhoneNumberChange}
        keyboardType="numeric"
        style={[styles.input, { borderColor: "gray" }]}
        returnKeyType="next"
        onSubmitEditing={() => parentEmailRef.current?.focus()}
      />

      {/* Email */}
      <Text style={styles.label}>Correo electrónico (opcional)</Text>
      <TextInput
        ref={parentEmailRef}
        placeholder="usuario@correo.com"
        placeholderTextColor="#666"
        value={parentEmail}
        onChangeText={handleParentEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        style={[
          styles.input,
          { borderColor: errors.parentEmail ? "red" : "gray" },
        ]}
        returnKeyType="done"
        onSubmitEditing={validateAndNext}
      />
      {errors.parentEmail && (
        <Text style={styles.errorText}>{errors.parentEmail}</Text>
      )}

      {/* Navegación */}
      <View style={styles.buttonContainer}>
        <Button title="← Anterior" onPress={handlePreviousSection} color="#4630EB" />
        <View style={styles.buttonSpacer} />
        <Button title="Siguiente →" onPress={validateAndNext} color="#4630EB" />
      </View>
    </View>
  );
};

const styles = {
  container: {
    width: "100%" as const,
    flexDirection: "column" as const,
  },
  header: {
    fontFamily: 'barlow-extrabold',
    fontSize: 20,
    padding: 5,
    marginBottom: -20,
    backgroundColor: '#f0f0f0'
  },
  label: {
    fontFamily: "barlow-semibold",
    fontSize: 16,
    marginBottom: 10,
    color: "#2d2d2d",
    textAlign: "left" as const,
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 12,
    width: "100%" as const,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    color: "#333333",
    borderRadius: 8,
    fontFamily: "barlow-regular",
    textAlign: "left" as const,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    fontFamily: "barlow-regular",
  },
  buttonContainer: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    marginTop: 20,
    width: "100%" as const,
  },
  buttonSpacer: {
    width: 20,
  },
  modalSelectorContainer: {
    width: "100%" as const,
    marginBottom: 20,
  },
};

export default Section2Form;
