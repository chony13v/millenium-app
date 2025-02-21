import React, { useCallback, useState, useRef } from "react";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
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
  FlatList // <-- added FlatList import
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
          setError("Hubo un problema al iniciar sesión. Por favor, inténtalo de nuevo");
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
      setError("");
      Alert.alert(
        "Listo!",
        "El código para restablecer la contraseña ha sido enviado a tu correo electrónico."
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
                Ingresa con tu email y password a Millenium Football Stars.
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
              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                value={password}
                placeholder="Password..."
                placeholderTextColor="#2C2F33"
                secureTextEntry={true}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError("");
                }}
                textContentType="password"
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={onSignInPress}
              />
              {error !== "" && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="red" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.loginButton} onPress={onSignInPress}>
                <Text style={styles.loginButtonText}>Ingresar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSendResetCode}>
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>¿No tienes una cuenta? </Text>
                <Link href="/sign-up">
                  <Text style={styles.signUpLink}>Regístrate acá</Text>
                </Link>
              </View>
              <View style={styles.separatorContainer}>
                <View style={styles.separator} />
                <Text style={styles.separatorText}>o</Text>
                <View style={styles.separator} />
              </View>
              <View style={styles.oauthContainer}>


                <SignInWithOAuth />

                
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
    width: '100%',
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
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
  },
  welcomeTitle: {
    fontFamily: 'barlow-regular',
    fontSize: 24,
    color: '#2C2F33',
    marginTop: 20,
  },
  welcomeSubtitle: {
    fontFamily: 'barlow-medium',
    fontSize: 16,
    color: '#2C2F33',
    marginTop: 10,
    textAlign: 'center',
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
    marginVertical: 1,
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
  },
  signUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginTop: 20,
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: '10%',
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
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginTop: 30,
  },
  separator: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1E1E1',
  },
  separatorText: {
    color: '#687076',
    marginHorizontal: 10,
    fontSize: 14,
    fontFamily: 'barlow-regular',
  },
  oauthContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
});