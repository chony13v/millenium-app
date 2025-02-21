import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import React from "react";
import { LinearGradient } from 'expo-linear-gradient';

export default function StyledButton({
  title,
  onPress,
  style,
}: {
  title: string;
  onPress: () => void;
  style?: any;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={{ width: "90%", alignItems: "center" }}>
      <LinearGradient
        colors={['#5865F2', '#5865F2', '#5865F2']} // Updated to use the Discord button color
        style={{
          padding: 15,
          alignItems: 'center',
          borderRadius: 10,
          width: "80%",
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
          ...style,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 20,
            textAlign: "center",
            fontFamily: 'barlow-semibold', // Changed from outfit-bold to barlow-semibold
          }}
        >
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#4630EB",
    padding: 15,
    borderRadius: 10,
    width: "100%",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontFamily: "barlow-semibold", // Changed from whatever it was before to barlow-semibold
  },
});