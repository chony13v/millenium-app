import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

import { conectaStyles as styles } from "@/app/(call)/Conecta.styles";

export const HeroCard = () => (
  <LinearGradient
    colors={["#1e3a8a", "#1e3a8a"]}
    start={[0, 0]}
    end={[1, 1]}
    style={styles.heroCard}
  >
    <View style={styles.heroRow}>
      <Text style={styles.heroBadge}>Participación Ciudad FC</Text>
    </View>
    <Text style={styles.heroSubtitle}>
      Encuestas rápidas y reportes ciudadanos para mejorar cada cancha. Tu voz
      cuenta.
    </Text>
    <View style={styles.heroTags}>
      <Text style={styles.heroTag}>Encuestas</Text>
      <Text style={styles.heroTag}>Reportes</Text>
      <Text style={styles.heroTag}>Comunidad</Text>
    </View>
  </LinearGradient>
);