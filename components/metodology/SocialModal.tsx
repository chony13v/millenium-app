import React from "react";
import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { type UseMetodologyLogicReturn } from "@/hooks/useMetodologyLogic";
import { metodologyStyles as styles } from "@/styles/metodology.styles";

export type SocialModalProps = {
  visible: boolean;
  onClose: () => void;
  officialSocialLinks: UseMetodologyLogicReturn["officialSocialLinks"];
  loadingSocialLinks: boolean;
  loadingSocialAvailability: boolean;
  hasAwardToday: UseMetodologyLogicReturn["hasAwardToday"];
  processingPlatform: UseMetodologyLogicReturn["processingPlatform"];
  onSocialLinkPress: (
    link: UseMetodologyLogicReturn["officialSocialLinks"][number]
  ) => void;
  platformLabel: (
    platform: UseMetodologyLogicReturn["officialSocialLinks"][number]["platform"]
  ) => string;
};

export const SocialModal: React.FC<SocialModalProps> = ({
  visible,
  onClose,
  officialSocialLinks,
  loadingSocialLinks,
  loadingSocialAvailability,
  hasAwardToday,
  processingPlatform,
  onSocialLinkPress,
  platformLabel,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalOverlay} />
    </TouchableWithoutFeedback>

    <View style={styles.modalCard}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Redes oficiales</Text>
        <Text style={styles.modalSubtitle}>
          Abre el enlace oficial para sumar una vez por día y plataforma.
        </Text>
      </View>

      {loadingSocialLinks || loadingSocialAvailability ? (
        <Text style={styles.mutedText}>Cargando redes...</Text>
      ) : officialSocialLinks.length === 0 ? (
        <Text style={styles.mutedText}>
          No encontramos redes oficiales activas.
        </Text>
      ) : (
        officialSocialLinks.map((link) => {
          const isBlocked = hasAwardToday[link.platform] === "blocked";
          const isProcessing = processingPlatform === link.platform;
          return (
            <TouchableOpacity
              key={link.id}
              style={[
                styles.socialItem,
                (isBlocked || isProcessing) && styles.actionCardDisabled,
              ]}
              onPress={() => onSocialLinkPress(link)}
              disabled={isBlocked || isProcessing}
              accessibilityLabel={`Abrir ${platformLabel(link.platform)}`}
            >
              <View style={styles.socialTextCol}>
                <Text style={styles.actionTitle}>
                  {link.title || platformLabel(link.platform)}
                </Text>
                <Text style={styles.socialSubtitle}>
                  {platformLabel(link.platform)}
                </Text>
                <Text style={styles.socialLinkLabel} numberOfLines={1}>
                  {link.link}
                </Text>
              </View>
              <View style={styles.socialStatusCol}>
                <Text
                  style={[
                    styles.statusBadge,
                    isBlocked ? styles.badgeBlocked : styles.badgeAvailable,
                  ]}
                >
                  {isBlocked ? "No disponible" : "Disponible"}
                </Text>
                {isProcessing ? (
                  <Text style={styles.processingText}>Enviando...</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })
      )}

      <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
        <Text style={styles.modalCloseText}>Cerrar</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);
