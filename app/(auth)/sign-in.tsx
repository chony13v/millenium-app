import React from "react";
import { useRouter, Link } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SignInWithOAuth from "@/components/SignInWithOAuth";

export default function SignInScreen() {
  const router = useRouter();

  const handleSignInWithEmail = () => {
    router.push("/(auth)/SignInForm");
  };

  return (
    <ImageBackground
      source={require("@/assets/images/initial_layout.png")}
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
              <Text style={styles.buttonText}>Continuar con tu email</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>o</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* <SignInWithOAuth /> */}

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>¿No tienes una cuenta?</Text>
            <Link href="/sign-up">
              <Text style={styles.signUpLink}>Regístrate acá</Text>
            </Link>
          </View>
        </View>
      </View>
    </ImageBackground>
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  container: {
    flex: 1,
    justifyContent: "flex-end", // mueve todo hacia abajo
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 130, 
  },
  transparentButton: {
    height: 55,
    width: "90%",
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
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontFamily: "barlow-medium",
    marginLeft: 10,
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
