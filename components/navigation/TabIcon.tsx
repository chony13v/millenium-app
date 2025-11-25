import React from "react";
import { StyleSheet, View } from "react-native";
import type { IconProps } from "@expo/vector-icons/build/createIconSet";

interface TabIconProps {
  focused: boolean;
  color: string;
  icon: React.ComponentType<IconProps<any>>;
  iconName: IconProps<any>["name"];
  size: number;
}

const TabIcon = ({ focused, color, icon: Icon, iconName, size }: TabIconProps) => {
  return (
    <View style={styles.container}>
      {focused && <View style={[styles.indicator, { backgroundColor: color }]} />}
      <Icon name={iconName} size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  indicator: {
    position: "absolute",
    top: -8,
    width: 45,
    height: 3,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});

export default TabIcon;