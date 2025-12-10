import { LinearGradient } from "expo-linear-gradient";
import { Text, View, TouchableOpacity } from "react-native";

import { conectaStyles as styles } from "@/styles/conectaStyles";

type HeroCardProps = {
  onPressSurvey?: () => void;
  onPressReports?: () => void;
  onPressCommunity?: () => void;
};

export const HeroCard = ({
  onPressSurvey,
  onPressReports,
  onPressCommunity,
}: HeroCardProps) => (
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
      <TouchableOpacity onPress={onPressSurvey} activeOpacity={0.8}>
        <Text style={styles.heroTag}>Encuestas</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPressCommunity} activeOpacity={0.8}>
        <Text style={styles.heroTag}>Comunidad</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPressReports} activeOpacity={0.8}>
        <Text style={styles.heroTag}>Reportes</Text>
      </TouchableOpacity>
    </View>
  </LinearGradient>
);
