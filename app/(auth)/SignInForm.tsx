import React, { useCallback, useState, useRef } from "react";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { MotiView } from "moti";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SignInWithOAuth from "@/components/SignInWithOAuth";

export default function SignInForm() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const passwordInputRef = useRef<TextInput>(null);

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifyingReset, setVerifyingReset] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSignInPress = useCallback(async () => {
    if (!isLoaded || !signIn) return;

    // Clear previous error
    setError("");

    // Validate email format
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailAddress || !emailRegex.test(emailAddress)) {
      setError("Por favor ingresa un correo electrónico válido");
      return;
    }

    // Validate password
    if (!password) {
      setError("Por favor ingresa tu contraseña");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      }
    } catch (err: any) {
      const errorCode = err.errors?.[0]?.code;
      switch (errorCode) {
        case "form_identifier_not_found":
          setError("Usuario no registrado");
          break;
        case "form_password_incorrect":
          setError("La contraseña es incorrecta");
          break;
        case "form_params_invalid":
          setError("Los datos ingresados no son válidos");
          break;
        case "rate_limit_exceeded":
          setError("Demasiados intentos. Por favor, intenta más tarde");
          break;
        default:
          setError(
            "Hubo un problema al iniciar sesión. Por favor, inténtalo de nuevo"
          );
      }
    }
  }, [isLoaded, emailAddress, password, signIn, setActive, router]);

  const handleSendResetCode = useCallback(async () => {
    if (!emailAddress || !signIn) {
      setError("Por favor ingresa tu correo electrónico.");
      return;
    }
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: emailAddress,
      });
      setVerifyingReset(true);
      setError("");
      Alert.alert(
        "Listo!",
        "El código para restablecer la contraseña ha sido enviado."
      );
    } catch (error: any) {
      setError(
        error.errors?.[0]?.longMessage ||
          "No se pudo enviar el correo de restablecimiento de contraseña."
      );
      Alert.alert(
        "Error",
        error.errors?.[0]?.longMessage ||
          "No se pudo enviar el correo de restablecimiento de contraseña."
      );
    }
  }, [emailAddress, signIn]);

  const handlePasswordReset = useCallback(async () => {
    if (!resetCode || !newPassword || !confirmPassword) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (!signIn) {
      setError("No se puede procesar la solicitud en este momento");
      return;
    }

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: newPassword,
      });

      if (result.status === "complete" && setActive) {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
      } else {
        setError("No se pudo completar el cambio de contraseña");
      }
    } catch (error: any) {
      console.log("Error during password reset:", error);
      setError(error.errors?.[0]?.message || "Error al cambiar la contraseña");
    }
  }, [resetCode, newPassword, confirmPassword, signIn, setActive, router]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "android" ? "padding" : "height"}
      style={styles.container}
    >
      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            <View style={styles.topSection}>
              <Image
                source={require("@/assets/images/logo_millenium.png")}
                style={styles.logo}
              />
              <Text style={styles.welcomeTitle}>Bienvenido</Text>
              <Text style={styles.welcomeSubtitle}>
                Accede a tu cuenta de{" "}
                <Text style={{ fontWeight: "bold" }}>
                  Millenium Gestión Deportiva
                </Text>{" "}
                con tu email y contraseña.
              </Text>
            </View>
            <View style={styles.formSection}>
              <TextInput
                autoCapitalize="none"
                style={styles.input}
                value={emailAddress}
                placeholder="Email..."
                placeholderTextColor="#2C2F33"
                onChangeText={(text) => {
                  setEmailAddress(text);
                  if (error) setError("");
                }}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
              <View style={styles.passwordContainer}>
                <TextInput
                  ref={passwordInputRef}
                  style={styles.passwordInput}
                  value={password}
                  placeholder="Contraseña..."
                  placeholderTextColor="#2C2F33"
                  secureTextEntry={!showPassword}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError("");
                  }}
                  textContentType="password"
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={onSignInPress}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#2C2F33"
                  />
                </TouchableOpacity>
              </View>

              {error !== "" && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="red" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={onSignInPress}
              >
                <Text style={styles.loginButtonText}>Ingresar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSendResetCode}>
                <Text style={styles.forgotPasswordText}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>

              {verifyingReset && (
                <MotiView
                  from={{ opacity: 0, translateY: -10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: "timing", duration: 400 }}
                  style={{ width: "100%", alignItems: "center" }}
                >
                  <TextInput
                    placeholder="Código de verificación"
                    placeholderTextColor="#2C2F33"
                    value={resetCode}
                    onChangeText={setResetCode}
                    style={styles.input}
                  />
                  <TextInput
                    placeholder="Nueva contraseña"
                    placeholderTextColor="#2C2F33"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    style={styles.input}
                  />
                  <TextInput
                    placeholder="Confirmar nueva contraseña"
                    placeholderTextColor="#2C2F33"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    style={styles.input}
                  />
                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handlePasswordReset}
                  >
                    <Text style={styles.loginButtonText}>
                      Restablecer contraseña
                    </Text>
                  </TouchableOpacity>
                </MotiView>
              )}

              {/* Separator with "o" placed before the sign-up section */}
              <View style={styles.separatorContainer}>
                <View style={styles.separator} />
                <Text style={styles.separatorText}>o</Text>
                <View style={styles.separator} />
              </View>
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>¿No tienes una cuenta? </Text>
                <Link href="/sign-up">
                  <Text style={styles.signUpLink}>Regístrate acá</Text>
                </Link>
              </View>
              <View style={styles.oauthContainer}>
                {/* Uncomment the line below to enable OAuth sign-in */}
                {/* <SignInWithOAuth /> */}
              </View>
            </View>
          </>
        }
        renderItem={null}
        showsVerticalScrollIndicator={false}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  topSection: {
    width: "100%",
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: "center",
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 50,
    height: 50,
    alignSelf: "center",
    marginBottom: 10,
    marginTop: 20,
  },
  welcomeTitle: {
    fontFamily: "barlow-regular",
    fontSize: 24,
    color: "#2C2F33",
    marginTop: 20,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontFamily: "barlow-medium",
    fontSize: 16,
    color: "#2C2F33",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  input: {
    height: 40,
    padding: 10,
    width: "80%",
    backgroundColor: "white",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#242c44",
    color: "#2C2F33",
    marginVertical: 2,
    fontSize: 14,
    fontFamily: "barlow-regular",
  },
  loginButton: {
    backgroundColor: "#242c44",
    paddingVertical: 10,
    borderRadius: 4,
    width: "60%",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "barlow-semibold",
  },
  forgotPasswordText: {
    color: "#2C2F33",
    textDecorationLine: "underline",
    fontFamily: "barlow-regular",
    fontSize: 15,
    marginTop: 10,
    textAlign: "center",
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    marginVertical: 20,
  },
  separator: {
    flex: 1,
    height: 1,
    backgroundColor: "#E1E1E1",
  },
  separatorText: {
    color: "#687076",
    marginHorizontal: 10,
    fontSize: 14,
    fontFamily: "barlow-regular",
  },
  signUpContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    marginTop: 20,
    justifyContent: "center",
  },
  signUpText: {
    color: "#242c44",
    fontSize: 13,
    fontFamily: "barlow-regular",
  },
  signUpLink: {
    color: "#242c44",
    textDecorationLine: "underline",
    fontFamily: "barlow-regular",
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginLeft: "10%",
    marginTop: 5,
    marginBottom: 10,
    gap: 5,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    fontFamily: "barlow-regular",
    flex: 1,
  },
  oauthContainer: {
    width: "100%",
    marginTop: 20,
    marginBottom: 20,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    backgroundColor: "white",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#242c44",
    marginVertical: 2,
    paddingHorizontal: 10,
    height: 40,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "barlow-regular",
    color: "#2C2F33",
  },
  eyeIcon: {
    paddingLeft: 8,
    paddingRight: 2,
  },
});
