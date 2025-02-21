import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';

type TermsModalProps = {
  visible: boolean;
  onClose: () => void;
};

const TermsModal: React.FC<TermsModalProps> = ({ visible, onClose }) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={{ 
      flex: 1, 
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <View style={{ 
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxHeight: '90%',
      }}>
        <ScrollView 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <Text style={{ fontFamily: 'outfit-bold', fontSize: 20, marginBottom: 20, textAlign: 'center', color: '#000000' }}>
            Términos y Condiciones para la Participación en el Torneo de Fútbol
          </Text>
          
          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>Aceptación de los Términos</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            Al inscribir a su hijo en el torneo de fútbol, usted, como padre, madre o tutor legal, acepta cumplir con los presentes Términos y Condiciones. La inscripción y participación en el torneo están sujetas a la aceptación de estos términos.
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>Inscripción</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            La inscripción debe completarse a través de nuestra aplicación móvil, proporcionando información precisa y actualizada. Nos reservamos el derecho de rechazar cualquier inscripción que no cumpla con los requisitos establecidos.
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>Consentimiento y Exoneración</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            Al inscribir a su hijo, usted consiente que participe en el torneo y asume todos los riesgos asociados con la participación en actividades deportivas. Usted exime a los organizadores del torneo, patrocinadores y afiliados de cualquier responsabilidad por lesiones, pérdidas o daños que puedan ocurrir durante el evento.
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>Uso de Imágenes</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            Usted autoriza a los organizadores a tomar fotografías y videos de su hijo durante el torneo, y a utilizarlos para fines promocionales y de marketing sin compensación adicional.
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>Protección de Datos</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            La información personal recopilada durante el proceso de inscripción será utilizada únicamente para la organización y gestión del torneo. Nos comprometemos a proteger la privacidad de los participantes y a manejar sus datos de acuerdo con la legislación ecuatoriana de protección de datos.
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>Conducta</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            Se espera que todos los participantes, así como sus padres o tutores, mantengan un comportamiento respetuoso y deportivo durante el torneo. Nos reservamos el derecho de descalificar a cualquier participante cuyo comportamiento sea considerado inapropiado.
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>Modificaciones del Evento</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            Los organizadores se reservan el derecho de modificar, posponer o cancelar el torneo por razones de seguridad, clima u otras circunstancias imprevistas. Se notificará a los participantes de cualquier cambio con la mayor antelación posible.
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>Contacto</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            Para cualquier consulta o información adicional, por favor contacte a 0984-7062-47
          </Text>
        </ScrollView>

        <TouchableOpacity
          onPress={onClose}
          style={{
            backgroundColor: '#4630EB',
            padding: 15,
            borderRadius: 5,
            alignItems: 'center',
            marginTop: 10,
          }}
        >
          <Text style={{ color: 'white', fontFamily: 'outfit-medium' }}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default TermsModal;