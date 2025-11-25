import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";

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
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          backgroundColor: "white",
          borderRadius: 10,
          padding: 20,
          width: "90%",
          maxHeight: "90%",
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <Text
            style={{
              fontFamily: "outfit-bold",
              fontSize: 20,
              marginBottom: 20,
              textAlign: "center",
              color: "#000000",
            }}
          >
            Términos y Condiciones de Uso
          </Text>

          <Text
            style={{
              fontFamily: "outfit-bold",
              fontSize: 16,
              marginTop: 15,
              color: "#000000",
            }}
          >
            1. Aceptación de los Términos
          </Text>
          <Text
            style={{
              fontFamily: "outfit-regular",
              marginBottom: 15,
              fontSize: 14,
              lineHeight: 20,
              color: "#000000",
            }}
          >
            Al acceder o utilizar esta aplicación, el usuario (o su padre/madre
            o tutor legal, en caso de ser menor de edad) acepta regirse por los
            presentes Términos y Condiciones. El uso de la app está condicionado
            a la aceptación de estos términos.
          </Text>

          <Text
            style={{
              fontFamily: "outfit-bold",
              fontSize: 16,
              marginTop: 15,
              color: "#000000",
            }}
          >
            2. Elegibilidad
          </Text>
          <Text
            style={{
              fontFamily: "outfit-regular",
              marginBottom: 15,
              fontSize: 14,
              lineHeight: 20,
              color: "#000000",
            }}
          >
            Esta aplicación está dirigida a usuarios de 13 años en adelante. Los
            menores de 13 años no deben utilizar la app. En el caso de menores
            entre 13 y 17 años, el padre, madre o tutor legal debe otorgar su
            consentimiento para participar en cualquier actividad del programa.
            El uso de la aplicación por menores de 18 años implica que el tutor
            legal ha revisado y aceptado estos términos junto con la política de
            privacidad.
          </Text>

          <Text
            style={{
              fontFamily: "outfit-bold",
              fontSize: 16,
              marginTop: 15,
              color: "#000000",
            }}
          >
            3. Registro
          </Text>
          <Text
            style={{
              fontFamily: "outfit-regular",
              marginBottom: 15,
              fontSize: 14,
              lineHeight: 20,
              color: "#000000",
            }}
          >
            El registro debe completarse a través de la aplicación móvil
            proporcionando información precisa y actualizada. Nos reservamos el
            derecho de denegar el acceso a usuarios que no cumplan con los
            criterios establecidos.
          </Text>

          <Text
            style={{
              fontFamily: "outfit-bold",
              fontSize: 16,
              marginTop: 15,
              color: "#000000",
            }}
          >
            4. Conducta del Usuario
          </Text>
          <Text
            style={{
              fontFamily: "outfit-regular",
              marginBottom: 15,
              fontSize: 14,
              lineHeight: 20,
              color: "#000000",
            }}
          >
            El usuario se compromete a utilizar la aplicación de manera
            responsable y respetuosa. Cualquier uso indebido, comportamiento
            inapropiado o abuso podrá resultar en la suspensión o cancelación
            del acceso a la plataforma.
          </Text>

          <Text
            style={{
              fontFamily: "outfit-bold",
              fontSize: 16,
              marginTop: 15,
              color: "#000000",
            }}
          >
            5. Uso de Imágenes y Contenidos
          </Text>
          <Text
            style={{
              fontFamily: "outfit-regular",
              marginBottom: 15,
              fontSize: 14,
              lineHeight: 20,
              color: "#000000",
            }}
          >
            Al utilizar la app, el usuario (o su representante legal) autoriza
            la toma de imágenes y videos durante entrenamientos o eventos, así
            como su uso con fines promocionales e institucionales por parte de
            MILLENIUMFS S.A.S., siempre respetando la dignidad y privacidad de
            los participantes, sin compensación adicional.
          </Text>

          <Text
            style={{
              fontFamily: "outfit-bold",
              fontSize: 16,
              marginTop: 15,
              color: "#000000",
            }}
          >
            6. Protección de Datos
          </Text>
          <Text
            style={{
              fontFamily: "outfit-regular",
              marginBottom: 15,
              fontSize: 14,
              lineHeight: 20,
              color: "#000000",
            }}
          >
            La información personal recopilada a través de la aplicación se
            utilizará exclusivamente para gestionar la participación del usuario
            y mejorar nuestros servicios. Cumplimos con la legislación
            ecuatoriana de protección de datos y adoptamos prácticas alineadas
            con normas internacionales como el RGPD, cuando aplique.
          </Text>

          <Text
            style={{
              fontFamily: "outfit-bold",
              fontSize: 16,
              marginTop: 15,
              color: "#000000",
            }}
          >
            7. Publicidad y Servicios de Terceros
          </Text>
          <Text
            style={{
              fontFamily: "outfit-regular",
              marginBottom: 15,
              fontSize: 14,
              lineHeight: 20,
              color: "#000000",
            }}
          >
            Esta aplicación muestra anuncios a través de redes certificadas como
            Google AdMob. Es posible que se recopile información no personal
            (por ejemplo, ID de dispositivo, patrones de uso) para mejorar la
            relevancia de los anuncios. La publicidad personalizada solo se
            mostrará cuando se haya obtenido el consentimiento informado y
            verificable del usuario o su tutor legal.
          </Text>

          <Text
            style={{
              fontFamily: "outfit-bold",
              fontSize: 16,
              marginTop: 15,
              color: "#000000",
            }}
          >
            8. Modificaciones
          </Text>
          <Text
            style={{
              fontFamily: "outfit-regular",
              marginBottom: 15,
              fontSize: 14,
              lineHeight: 20,
              color: "#000000",
            }}
          >
            Nos reservamos el derecho de modificar o discontinuar
            características de la app por razones de seguridad, cumplimiento
            legal o necesidades operativas. Notificaremos los cambios relevantes
            dentro de la app cuando sea posible.
          </Text>

          <Text
            style={{
              fontFamily: "outfit-bold",
              fontSize: 16,
              marginTop: 15,
              color: "#000000",
            }}
          >
            9. Contacto
          </Text>
          <Text
            style={{
              fontFamily: "outfit-regular",
              marginBottom: 15,
              fontSize: 14,
              lineHeight: 20,
              color: "#000000",
            }}
          >
            Para cualquier consulta o información adicional, por favor
            contáctenos en: info@milleniumfc.com
          </Text>
        </ScrollView>

        <TouchableOpacity
          onPress={onClose}
          style={{
            backgroundColor: "#4630EB",
            padding: 15,
            borderRadius: 5,
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <Text style={{ color: "white", fontFamily: "outfit-medium" }}>
            Cerrar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default TermsModal;
