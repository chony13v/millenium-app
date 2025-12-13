import React from "react";
import { View, Text, StyleSheet, Animated, Easing, Image } from "react-native";

interface LoadingBallProps {
  text?: string;
}

export default function LoadingBall({
  text = "Cargando...",
}: LoadingBallProps) {
  const bounceValue = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bounceValue, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const bounce = bounceValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40], // Bounce height in pixels
  });

  return (
    <View style={styles.loadingContainer}>
      <Animated.View
        style={[
          styles.loadingIcon,
          {
            transform: [{ translateY: bounce }],
          },
        ]}
      >
        <Image
          source={require("@/assets/images/loading.png")}
          style={{ width: 40, height: 40 }}
        />
      </Animated.View>
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  loadingIcon: {
    marginBottom: 20,
  },
  loadingText: {
    fontFamily: "barlow-medium",
    fontSize: 16,
    color: "#0A2240",
  },
});
