import React from "react";
import { useRouter, Link } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ScrollView,
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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSignInWithEmail}
              activeOpacity={0.7}
            >
              <View style={styles.buttonContent}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#242c44"
                />
                <Text style={styles.buttonText}>Continuar con tu email</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>o</Text>
              <View style={styles.separatorLine} />
            </View>

            
            <SignInWithOAuth />
         

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>¿No tienes una cuenta?</Text>
              <Link href="/sign-up">
                <Text style={styles.signUpLink}>Regístrate acá</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

SignInScreen.options = {
  headerShown: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 225,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  button: {
    height: 40,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#dadce0",
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    width: "80%",
    maxWidth: 250,
    marginTop: -10,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "#3c4043",
    fontSize: 14,
    fontFamily: "barlow-medium",
    letterSpacing: 0.25,
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
    color: "white",
    fontFamily: "barlow-regular",
    fontSize: 14,
  },
  signUpContainer: {
    marginTop: 3,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpText: {
    color: "white",
    fontSize: 16,
    fontFamily: "barlow-regular",
  },
  signUpLink: {
    color: "white",
    textDecorationLine: "underline",
    fontFamily: "barlow-regular",
    fontSize: 16,
  },
});
