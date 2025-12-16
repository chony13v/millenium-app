import React from "react";
import { Image, Text, View } from "react-native";

import { type UseMetodologyLogicReturn } from "@/hooks/useMetodologyLogic";
import { metodologyStyles as styles } from "@/styles/metodology.styles";

export type HistorySectionProps = {
  history: UseMetodologyLogicReturn["history"];
  loading: boolean;
  renderHistoryLabel: (
    eventType: string,
    metadata?: Record<string, unknown>
  ) => string;
  formatDate: (date?: Date) => string;
};

export const HistorySection: React.FC<HistorySectionProps> = ({
  history,
  loading,
  renderHistoryLabel,
  formatDate,
}) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Historial reciente</Text>
      <Text style={[styles.sectionPill, styles.pillMuted]}>Últimos 5</Text>
    </View>

    {loading && <Text style={styles.mutedText}>Cargando puntos...</Text>}

    {!loading && history.length === 0 && (
      <Text style={styles.mutedText}>
        Aún no tienes movimientos en tu perfil de puntos.
      </Text>
    )}

    {history.slice(0, 5).map((entry) => (
      <View key={entry.id} style={styles.historyRow}>
        {((entry as any).imageUrl || (entry as any).metadata?.imageUrl) ? (
          <Image
            source={{
              uri:
                (entry as any).imageUrl ||
                ((entry as any).metadata?.imageUrl as string),
            }}
            style={styles.historyThumb}
            resizeMode="cover"
          />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.historyTitle}>
            {renderHistoryLabel(entry.eventType, entry.metadata)}
          </Text>
          <Text style={styles.historyDate}>
            {formatDate(entry.createdAt?.toDate())}
          </Text>
        </View>
        <Text
          style={[
            styles.historyPoints,
            entry.points >= 0 ? styles.pointsPositive : styles.pointsNegative,
          ]}
        >
          {entry.points >= 0 ? "+" : ""}
          {entry.points} pts
        </Text>
      </View>
    ))}
  </View>
);
