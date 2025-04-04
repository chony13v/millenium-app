import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';

type PrivacyModalProps = {
  visible: boolean;
  onClose: () => void;
};

const PrivacyModal: React.FC<PrivacyModalProps> = ({ visible, onClose }) => (
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
            Política de Privacidad y Manejo de Datos Personales
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>1. Introducción</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            Esta Política de Privacidad describe cómo MILLENIUMFS S.A.S. recopila, utiliza y protege la información personal de los usuarios de nuestra aplicación móvil para el registro y participación en actividades relacionadas con el fútbol juvenil.
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>2. Información que Recopilamos</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            Recopilamos la siguiente información personal de los participantes y sus padres o tutores legales:
            {'\n'}- Nombre completo del niño
            {'\n'}- Fecha de nacimiento
            {'\n'}- Información médica relevante
            {'\n'}- Nombre completo del padre/tutor
            {'\n'}- Información de contacto (teléfono y correo electrónico)
            {'\n'}- Afiliación a equipo o club (si aplica)
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>3. Uso de la Información</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            La información recopilada se utiliza para:
            {'\n'}- Gestionar la inscripción y participación en el programa
            {'\n'}- Comunicarnos con los padres o tutores
            {'\n'}- Garantizar la seguridad y bienestar de los participantes
            {'\n'}- Cumplir con requisitos legales y normativos
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>4. Compartición de la Información</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            No compartimos la información personal con terceros, excepto cuando sea necesario para cumplir con la ley, proteger nuestros derechos, o en el caso de una emergencia médica.
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>5. Seguridad de la Información</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            Implementamos medidas de seguridad técnicas y organizativas para proteger la información personal contra el acceso no autorizado, la alteración, divulgación o destrucción.
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>6. Derechos de los Usuarios</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            De acuerdo con la legislación ecuatoriana, los usuarios tienen derecho a:
            {'\n'}- Acceder a sus datos personales
            {'\n'}- Rectificar datos inexactos o incompletos
            {'\n'}- Solicitar la eliminación de sus datos personales
            {'\n'}- Oponerse al tratamiento de sus datos personales
            {'\n'}Para ejercer estos derechos o si tiene preguntas, por favor contacte a: info@milleniumfs.com
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>7. Retención de Datos</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            Conservamos la información personal solo durante el tiempo necesario para cumplir con los fines para los que fue recopilada, o según lo requiera la ley.
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>8. Cambios a esta Política</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier momento. Notificaremos a los usuarios sobre cambios significativos a través de nuestra aplicación o por correo electrónico.
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>9. Servicios de Terceros</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            Podemos utilizar servicios de terceros como Google AdMob, Firebase o Google Analytics para mostrar publicidad y mejorar la funcionalidad de la aplicación. Estos servicios pueden recopilar información no personal como identificadores del dispositivo, tipo de sistema operativo y uso general de la app. No recopilamos datos para fines publicitarios sin consentimiento.
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>10. Publicidad</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            Nuestra aplicación puede mostrar anuncios con el fin de financiar su mantenimiento y desarrollo. Trabajamos con redes de publicidad aprobadas que cumplen con los estándares de privacidad para adolescentes. En caso de utilizar publicidad personalizada, solicitaremos consentimiento explícito conforme a la legislación vigente.
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>11. Política Pública en Línea</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            Esta política también está disponible en línea en la siguiente dirección: https://chony13v.github.io/milleniumapp-privacy-policy/
          </Text>

          <Text style={{ fontFamily: 'outfit-bold', fontSize: 16, marginTop: 15, color: '#000000' }}>12. Contacto</Text>
          <Text style={{ fontFamily: 'outfit-regular', marginBottom: 15, fontSize: 14, lineHeight: 20, color: '#000000' }}>
            Si tiene preguntas o inquietudes sobre esta Política de Privacidad, por favor contacte a info@milleniumfs.com
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

export default PrivacyModal;
