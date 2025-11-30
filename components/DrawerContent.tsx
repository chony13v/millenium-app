import React, { memo, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DrawerContentProps {
  onCalendarPress: () => void;
  onProfilePress: () => void;
  onSettingsPress: () => void;
  onSignOutPress: () => void;
}

const DrawerContent: React.FC<DrawerContentProps> = memo(
  ({ onCalendarPress, onProfilePress, onSettingsPress, onSignOutPress }) => {
    const insets = useSafeAreaInsets();

    const items = useMemo(
      () => [
        {
          label: "Calendario",
          icon: "calendar" as const,
          onPress: onCalendarPress,
        },
        { label: "Mi Perfil", icon: "user" as const, onPress: onProfilePress },
        {
          label: "Configuración",
          icon: "cog" as const,
          onPress: onSettingsPress,
        },
        {
          label: "Cerrar Sesión",
          icon: "sign-out" as const,
          onPress: onSignOutPress,
        },
      ],
      [onCalendarPress, onProfilePress, onSettingsPress, onSignOutPress]
    );

    return (
      <View style={[styles.container, { paddingTop: insets.top + 5 }]}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.item}
            onPress={item.onPress}
            activeOpacity={0.85}
          >
            <FontAwesome name={item.icon} size={24} color={Colors.NAVY_BLUE} />
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
);

export default DrawerContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  label: {
    fontSize: 16,
    fontFamily: "barlow-medium",
    marginLeft: 10,
    color: "gray",
  },
});
