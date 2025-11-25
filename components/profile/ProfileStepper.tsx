import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  currentSection: number;
  totalSections: number;
  title: string;
  isKeyboardVisible: boolean;
}

const ProfileStepper = ({ currentSection, totalSections, title, isKeyboardVisible }: Props) => {
  if (isKeyboardVisible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>{title}</Text>
      <Text style={styles.subText}>{`Paso ${currentSection} de ${totalSections}`}</Text>
    </View>
  );
};

export default ProfileStepper;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 20,
    marginBottom: 10,
  },
  headerText: {
    fontFamily: "barlow-semibold",
    fontSize: 15,
  },
  subText: {
    fontFamily: "barlow-regular",
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
});