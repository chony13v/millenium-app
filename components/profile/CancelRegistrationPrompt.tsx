import React from "react";
import { StyleSheet, Text, View } from "react-native";

type CancelRegistrationPromptProps = {
  onCancel: () => void;
};

const CancelRegistrationPrompt = ({
  onCancel,
}: CancelRegistrationPromptProps) => {
  return (
    <View style={styles.cancelContainer}>
      <Text onPress={onCancel} style={styles.cancelText}>
        ¿Deseas cancelar el registro?
      </Text>
    </View>
  );
};

export default CancelRegistrationPrompt;

const styles = StyleSheet.create({
  cancelContainer: {
    width: "100%",
    alignItems: "center",
    marginVertical: 20,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "barlow-medium",
    textDecorationLine: "underline",
    color: "#0A2240",
  },
});
