import React from "react";
import { useRouter, Link } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

export default function SignInScreen() {
  const router = useRouter();

  const handleSignInWithEmail = () => {
    router.push("/(auth)/SignInForm");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <ImageBackground
        source={require("@/assets/images/home_bg.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <TouchableOpacity
              onPress={handleSignInWithEmail}
              activeOpacity={0.9}
              style={styles.transparentButton}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="mail-outline" size={20} color="#ffffff" />
                <Text
                  style={styles.buttonText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Continuar con tu email
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>o</Text>
              <View style={styles.separatorLine} />
            </View>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>¿No tienes una cuenta?</Text>
              <Link href="/sign-up">
                <Text style={styles.signUpLink}>Regístrate acá</Text>
              </Link>
            </View>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

SignInScreen.options = {
  headerShown: false,
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  transparentButton: {
    height: 55,
    width: "70%",
    maxWidth: 320,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 16,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "barlow-medium",
    marginLeft: 10,
    flexShrink: 1,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    marginVertical: 15,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#dadce0",
  },
  separatorText: {
    marginHorizontal: 10,
    color: "#ffffff",
    fontFamily: "barlow-regular",
    fontSize: 14,
  },
  signUpContainer: {
    marginTop: 5,
    width: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "barlow-regular",
    textAlign: "center",
  },
  signUpLink: {
    color: "#ffffff",
    textDecorationLine: "underline",
    fontFamily: "barlow-regular",
    fontSize: 16,
    textAlign: "center",
  },
});
