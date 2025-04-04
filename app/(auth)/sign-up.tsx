import * as React from "react";
import {
  TextInput,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { useState, useRef } from "react";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Checkbox from "expo-checkbox";
import useFonts from "@/hooks/useFonts";

import TermsModal from "@/components/modals/TermsModal";
import PrivacyModal from "@/components/modals/PrivacyModal";

export default function SignUpScreen() {
  const fontsLoaded = useFonts();
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [code, setCode] = useState("");

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const openTermsModal = () => setTermsVisible(true);
  const closeTermsModal = () => setTermsVisible(false);
  const openPrivacyModal = () => setPrivacyVisible(true);
  const closePrivacyModal = () => setPrivacyVisible(false);

  if (!fontsLoaded) return null;

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    // Validate that all fields are filled
    if (!firstName || !lastName || !emailAddress || !password) {
      Alert.alert("Error", "Por favor, completa todos los campos");
      return;
    }

    // Validate email format
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(emailAddress)) {
      Alert.alert("Error", "El formato del correo electrónico no es válido");
      return;
    }

    // Validate password length
    if (password.length < 8) {
      Alert.alert("Error", "La contraseña debe tener al menos 8 caracteres");
      return;
    }

    // Validate terms acceptance
    if (!acceptedTerms) {
      Alert.alert("Error", "Debes aceptar los términos y condiciones");
      return;
    }

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      if (
        err.errors?.[0]?.code === "form_identifier_exists" ||
        err.errors?.[0]?.code === "form_param_exists"
      ) {
        Alert.alert("Error", "Este correo electrónico ya está registrado.");
      } else {
        Alert.alert("Error", err.errors?.[0]?.message || "Ocurrió un error.");
      }
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace("/");
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
      }
    } catch (err: any) {
      Alert.alert(
        "Whoops",
        "Parece que ingresaste un código incorrecto \n\nIntenta de nuevo."
      );
    }
  };

  const onResendCode = async () => {
    if (!isLoaded) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      Alert.alert("Éxito", "El código de verificación ha sido reenviado.");
    } catch (err: any) {
      Alert.alert("Error", "No se pudo reenviar el código. Intenta de nuevo más tarde.");
    }
  };

  return (
    <FlatList
      style={{ backgroundColor: "white", flex: 1 }}
      data={[{ key: "content" }]}
      keyExtractor={(item) => item.key}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 25 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
      renderItem={() => (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <TermsModal visible={termsVisible} onClose={closeTermsModal} />
          <PrivacyModal visible={privacyVisible} onClose={closePrivacyModal} />

          {!pendingVerification && (
            <View style={styles.formContainer}>
              <Image
                source={require("@/assets/images/logo_millenium.png")}
                style={styles.logo}
              />
              <Text style={styles.title}>
                Ingresa tus datos para registrarte con MilleniumFS
              </Text>
              <TextInput
                style={styles.input}
                autoFocus={true}
                value={firstName}
                placeholder="Nombre..."
                onChangeText={(text) => setFirstName(text)}
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
              />
              <TextInput
                style={styles.input}
                value={lastName}
                placeholder="Apellido..."
                onChangeText={(text) => setLastName(text)}
                ref={lastNameRef}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                value={emailAddress}
                placeholder="Email..."
                onChangeText={(text) => setEmailAddress(text)}
                keyboardType="email-address"
                ref={emailRef}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <TextInput
                style={styles.input}
                value={password}
                placeholder="Password..."
                secureTextEntry={true}
                onChangeText={(text) => setPassword(text)}
                ref={passwordRef}
                returnKeyType="done"
              />
              <View style={styles.acceptTermsContainer}>
                <Checkbox
                  value={acceptedTerms}
                  onValueChange={setAcceptedTerms}
                  color={acceptedTerms ? "#4630EB" : undefined}
                />
                <Text style={styles.description}>
                  Al registrarte, aceptas los{" "}
                  <Text style={styles.link} onPress={openTermsModal}>
                    Términos de Servicio
                  </Text>{" "}
                  y la{" "}
                  <Text style={styles.link} onPress={openPrivacyModal}>
                    Política de Privacidad
                  </Text>
                  .
                </Text>
              </View>
              <Text style={styles.minAgeText}>
                Recuerda que debes tener al menos 13 años para registrarte.
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.signUpButton}
                  onPress={onSignUpPress}
                >
                  <Text style={styles.signUpButtonText}>Regístrate</Text>
                </TouchableOpacity>
                <Text style={styles.existingAccountText}>
                  ¿Ya tienes una cuenta?
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/(auth)/sign-in")}
                >
                  <Text style={styles.loginLink}> Inicia sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {pendingVerification && (
            <View style={styles.verificationContainer}>
              <Text style={styles.verificationText}>
                Hemos enviado un código de verificación a tu correo electrónico.
                Por favor, ingrésalo en el campo de abajo.
              </Text>
              <TextInput
                value={code}
                style={styles.codeInput}
                placeholder="Código..."
                onChangeText={(text) => setCode(text)}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={onPressVerify}
              />
              <View style={styles.verifyButtonContainer}>
                <TouchableOpacity
                  style={styles.largeButton}
                  onPress={onPressVerify}
                >
                  <Text style={styles.largeButtonText}>Verificar Email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.largeButton, { marginTop: 15 }]}
                  onPress={onResendCode}
                >
                  <Text style={styles.largeButtonText}>Reenviar Código</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 25,
    justifyContent: "center",
  },
  formContainer: {
    gap: 10,
  },
  logo: {
    width: 50,
    height: 50,
    alignSelf: "center",
    marginBottom: 1,
    marginTop: 50,
  },
  title: {
    color: "black",
    fontSize: 18,
    textAlign: "center",
    fontFamily: "barlow-regular",
    marginBottom: 15,
  },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    height: 40,
    width: "85%",
    alignSelf: "center",
    backgroundColor: "white",
    fontFamily: "barlow-medium",
    borderRadius: 4,
    borderWidth: 1,
  },
  acceptTermsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 8,
  },
  description: {
    fontFamily: "barlow-regular",
    flex: 1,
    fontSize: 13,
    textAlign: "justify",
  },
  link: {
    color: "#242c44",
    textDecorationLine: "underline",
    fontFamily: "barlow-medium",
    fontSize: 13,
  },
  minAgeText: {
    fontFamily: "barlow-regular",
    fontSize: 13,
    textAlign: "justify",
    marginTop: 2,
    color: "black",
    marginHorizontal: 20,
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 15,
  },
  existingAccountText: {
    marginTop: 20,
    textAlign: "center",
    fontFamily: "barlow-regular",
    fontSize: 15,
  },
  loginLink: {
    color: "#242c44",
    textAlign: "center",
    fontFamily: "barlow-semibold",
    fontSize: 15,
  },
  verificationContainer: {
    alignItems: "center",
  },
  verificationText: {
    color: "black",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    marginTop: 90,
    fontFamily: "barlow-medium",
  },
  codeInput: {
    padding: 16,
    width: "70%",
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    fontFamily: "barlow-medium",
    textAlign: "center",
  },
  verifyButtonContainer: {
    alignItems: "center",
    marginTop: 35,
    gap: 10,
    width: "90%",
    paddingHorizontal: 20,
  },
  signUpButton: {
    backgroundColor: "#242c44",
    paddingVertical: 10,
    borderRadius: 4,
    width: "60%",
    alignItems: "center",
  },
  signUpButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "barlow-semibold",
  },
  largeButton: {
    backgroundColor: "#242c44",
    paddingVertical: 10,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
  },
  largeButtonText: {
    color: "white",
    fontSize: 15,
    fontFamily: "barlow-semibold",
  },
});