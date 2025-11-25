import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DrawerContentProps {
  onCalendarPress: () => void;
  onProfilePress: () => void;
  onSettingsPress: () => void;
  onSignOutPress: () => void;
}

const DrawerContent: React.FC<DrawerContentProps> = ({
  onCalendarPress,
  onProfilePress,
  onSettingsPress,
  onSignOutPress,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        paddingTop: insets.top + 5,
      }}
    >
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 15,
          borderBottomWidth: 1,
          borderBottomColor: "#e0e0e0",
        }}
        onPress={onCalendarPress}
      >
        <FontAwesome name="calendar" size={24} color={Colors.NAVY_BLUE} />
        <Text
          style={{
            fontSize: 16,
            fontFamily: "barlow-medium",
            marginLeft: 10,
            color: "gray",
          }}
        >
          Calendario
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 15,
          borderBottomWidth: 1,
          borderBottomColor: "#e0e0e0",
        }}
        onPress={onProfilePress}
      >
        <FontAwesome name="user" size={24} color={Colors.NAVY_BLUE} />
        <Text
          style={{
            fontSize: 16,
            fontFamily: "barlow-medium",
            marginLeft: 10,
            color: "gray",
          }}
        >
          Mi Perfil
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 15,
          borderBottomWidth: 1,
          borderBottomColor: "#e0e0e0",
        }}
        onPress={onSettingsPress}
      >
        <FontAwesome name="cog" size={24} color={Colors.NAVY_BLUE} />
        <Text
          style={{
            fontSize: 16,
            fontFamily: "barlow-medium",
            marginLeft: 10,
            color: "gray",
          }}
        >
          Configuración
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 15,
          borderBottomWidth: 1,
          borderBottomColor: "#e0e0e0",
        }}
        onPress={onSignOutPress}
      >
        <FontAwesome name="sign-out" size={24} color={Colors.NAVY_BLUE} />
        <Text
          style={{
            fontSize: 16,
            fontFamily: "barlow-medium",
            marginLeft: 10,
            color: "gray",
          }}
        >
          Cerrar Sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default DrawerContent;
