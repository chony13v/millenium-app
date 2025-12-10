import React from "react";
import { Modal, View, Text, TouchableOpacity, FlatList } from "react-native";
import { metodologyStyles as styles } from "@/styles/metodology.styles";

export type RewardItem = {
  id: string;
  title: string;
  cost: number;
  description?: string;
  type?: "discount" | "cash" | "gift";
};

type Props = {
  visible: boolean;
  onClose: () => void;
  rewards: RewardItem[];
};

export const RewardCatalogModal: React.FC<Props> = ({
  visible,
  onClose,
  rewards,
}) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
    <View style={styles.modalCard}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Catálogo de recompensas</Text>
        <Text style={styles.modalSubtitle}>
          Canjea tus puntos por descuentos, efectivo o beneficios exclusivos.
        </Text>
      </View>

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <View style={styles.socialItem}>
            <View style={styles.socialTextCol}>
              <Text style={styles.actionTitle}>{item.title}</Text>
              {item.description ? (
                <Text style={styles.socialLinkLabel}>{item.description}</Text>
              ) : null}
            </View>
            <View style={styles.socialStatusCol}>
              <Text style={styles.actionPoints}>{item.cost} pts</Text>
              <Text style={styles.processingText}>
                {item.type === "cash"
                  ? "Transferencia"
                  : item.type === "discount"
                  ? "Descuento"
                  : "Beneficio"}
              </Text>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
        <Text style={styles.modalCloseText}>Cerrar</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);
