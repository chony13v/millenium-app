import React, {useRef} from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import ModalSelector from 'react-native-modal-selector';

interface Section1FormProps {
  nombreCompleto: string;
  idNumber: string;
  birthDate: string;
  selectedPosition: string;
  selectedCity: string;
  selectedDateTime: string;
  informacionMedica: string;
  afiliacionEquipo: string;
  errors: any;
  dateTimes: Array<{key: string, label: string}>;
  positions: Array<{key: string, label: string}>;
  cities: Array<{key: string, label: string}>;
  handleNombreCompletoChange: (text: string) => void;
  handleIdNumberChange: (text: string) => void;
  handleBirthDateChange: (text: string) => void;
  handleSelectedPositionChange: (option: {key: string, label: string}) => void;
  handleCityChange: (option: {key: string, label: string}) => void;
  setSelectedDateTime: (value: string) => void;
  handleInformacionMedicaChange: (text: string) => void;
  handleAfiliacionEquipoChange: (text: string) => void;
  handleNextSection: () => void;
}

const Section1Form: React.FC<Section1FormProps> = ({
  nombreCompleto,
  idNumber,
  birthDate,
  selectedPosition,
  selectedCity,
  selectedDateTime,
  informacionMedica,
  afiliacionEquipo,
  errors,
  dateTimes,
  positions,
  cities,
  handleNombreCompletoChange,
  handleIdNumberChange,
  handleBirthDateChange,
  handleSelectedPositionChange,
  handleCityChange,
  setSelectedDateTime,
  handleInformacionMedicaChange,
  handleAfiliacionEquipoChange,
  handleNextSection,
}) => {

  const nombreCompletoRef = useRef<TextInput>(null);
  const idNumberRef = useRef<TextInput>(null);
  const birthDateRef = useRef<TextInput>(null);
  const positionRef = useRef<TextInput>(null);
  const informacionMedicaRef = useRef<TextInput>(null);
  const afiliacionEquipoRef = useRef<TextInput>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Sección 1: {'\n'}Información del becario
      </Text>
      
      <View style={{ marginVertical: 15 }} />

      <Text style={styles.label}>Nombre completo del aspirante</Text>
      <TextInput
      ref={nombreCompletoRef}
        placeholder="Nombre Completo"
        placeholderTextColor="#666666"
        value={nombreCompleto}
        onChangeText={handleNombreCompletoChange}
        style={[styles.input, {borderColor: errors.nombreCompleto ? 'red' : 'gray'}]}
        returnKeyType='next'
        onSubmitEditing={() => idNumberRef.current?.focus()}
      />
      {errors.nombreCompleto && <Text style={styles.errorText}>{errors.nombreCompleto}</Text>}

      <Text style={styles.label}>Número de Cédula del Aspirante</Text>
      <TextInput
      ref={idNumberRef}
        placeholder="Número de Cédula"
        placeholderTextColor="#666666"
        value={idNumber}
        onChangeText={handleIdNumberChange}
        keyboardType="numeric"
        maxLength={10}
        style={[styles.input, {borderColor: errors.idNumber ? 'red' : 'gray'}]}
      returnKeyType='next'
      onSubmitEditing={() => birthDateRef.current?.focus()}
      />
      {errors.idNumber && <Text style={styles.errorText}>{errors.idNumber}</Text>}

      <Text style={styles.label}>Fecha de Nacimiento</Text>
      <TextInput
      ref={birthDateRef}
        placeholder="DD/MM/YYYY"
        placeholderTextColor="#666666"
        value={birthDate}
        onChangeText={handleBirthDateChange}
        keyboardType="numeric"
        maxLength={10}
        returnKeyType="next"
        style={[styles.input, {borderColor: errors.birthDate ? 'red' : 'gray'}]}
        onSubmitEditing={() => positionRef.current?.focus()}
      />
      {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}

      <Text style={styles.label}>Posición Favorita en el Campo de Fútbol</Text>
      <ModalSelector
        data={positions}
        initValue="Selecciona una posición"
        onChange={handleSelectedPositionChange}
        style={{width: '100%', marginBottom: errors.position ? 5 : 20}}
      >
        <TextInput
          editable={false}
          placeholder="Escoje la posición"
          placeholderTextColor="#666666"
          value={selectedPosition}
          style={[styles.input, {borderColor: errors.position ? 'red' : 'gray'}]}
        />
      </ModalSelector>
      {errors.position && <Text style={styles.errorText}>{errors.position}</Text>}

      <Text style={styles.label}>Ubicación del Torneo</Text>
      <ModalSelector
        data={cities}
        initValue="Selecciona una ciudad"
        onChange={handleCityChange}
        style={{width: '100%', marginBottom: errors.city ? 5 : 20}}
      >
        <TextInput
          editable={false}
          placeholder="Escoje la ciudad"
          placeholderTextColor="#666666"
          value={selectedCity}
          style={[styles.input, {borderColor: errors.city ? 'red' : 'gray'}]}
        />
      </ModalSelector>
      {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

      {selectedCity !== '' && (
        <>
          <ModalSelector
            data={dateTimes}
            initValue="Selecciona Fecha y Hora"
            onChange={(option) => setSelectedDateTime(option.key)}
            style={{width: '100%', marginBottom: errors.dateTime ? 5 : 20}}
          >
            <TextInput
              editable={false}
              placeholder="Escoje la fecha y hora"
              placeholderTextColor="#666666"
              value={selectedDateTime}
              style={[styles.input, {borderColor: errors.dateTime ? 'red' : 'gray'}]}
            />
          </ModalSelector>
          {errors.dateTime && <Text style={styles.errorText}>{errors.dateTime}</Text>}
        </>
      )}

      <Text style={styles.label}>Información Médica</Text>
      <TextInput
      ref={informacionMedicaRef}
        placeholder="Incluya cualquier condición médica relevante o alergias..."
        placeholderTextColor="#666666"
        value={informacionMedica}
        onChangeText={handleInformacionMedicaChange}
        style={[styles.input, styles.multilineInput, {borderColor: errors.informacionMedica ? 'red' : 'gray'}]}
        returnKeyType='next'
        onSubmitEditing={() => afiliacionEquipoRef.current?.focus()}
      />
      {errors.informacionMedica && <Text style={styles.errorText}>{errors.informacionMedica}</Text>}

      <Text style={styles.label}>Afiliación a Equipo o Club del Barrio</Text>
      <TextInput
      ref={afiliacionEquipoRef}
        placeholder="Llenar solo si aplica"
        placeholderTextColor="#666666"
        value={afiliacionEquipo}
        onChangeText={handleAfiliacionEquipoChange}
        style={[styles.input, {borderColor: errors.afiliacionEquipo ? 'red' : 'gray'}]}
        returnKeyType='done'
        onSubmitEditing={handleNextSection}
      />
      {errors.afiliacionEquipo && <Text style={styles.errorText}>{errors.afiliacionEquipo}</Text>}

      <View style={styles.buttonContainer}>
        <Button 
          title="Siguiente →"
          color="#4630EB"
          onPress={handleNextSection}
        />
      </View>
    </View>
  );
};

const styles = {
  container: {
    width: '100%' as '100%',
    flexDirection: 'column' as const
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
    flexDirection: 'row' as 'row',
    justifyContent: 'center' as 'center',
    marginTop: 20,
    with: '100%' as const,
  },
  multilineInput: {
    textAlignVertical: 'top' as 'top',
  }
};


export default Section1Form;