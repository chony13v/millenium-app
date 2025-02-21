import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import TermsModal from '@/components/modals/TermsModal';
import PrivacyModal from '@/components/modals/PrivacyModal';

// Firebase imports
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/config/FirebaseConfig';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

const SignInWithGoogle = () => {
  useWarmUpBrowser();
  const router = useRouter();
  const [isTermsVisible, setIsTermsVisible] = useState(false);
  const [isPrivacyVisible, setIsPrivacyVisible] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
    // Ensure Firebase receives an id_token for credential creation.
    responseType: 'id_token',
    redirectUri: makeRedirectUri({
      scheme: 'milleniumfs',
      path: 'home'
    })
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        // Build a Firebase credential with the tokens.
        const credential = GoogleAuthProvider.credential(
          authentication.idToken,
          authentication.accessToken
        );
        signInWithCredential(auth, credential)
          .then(() => {
            // Firebase successfully authenticated the user.
            router.replace('/home');
          })
          .catch((error) => {
            console.error('Firebase authentication failed:', error);
          });
      } else {
        console.error('Missing idToken in authentication response', response);
      }
    }
  }, [response]);

  const onPress = useCallback(async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google Sign In Error:', error);
    }
  }, [promptAsync]);

  const openTermsModal = () => setIsTermsVisible(true);
  const closeTermsModal = () => setIsTermsVisible(false);
  
  const openPrivacyModal = () => setIsPrivacyVisible(true);
  const closePrivacyModal = () => setIsPrivacyVisible(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.buttonContent}>
          <Ionicons name="logo-google" size={20} color="#DB4437" />
          <Text style={styles.buttonText}>Continuar con Google</Text>
        </View>
      </TouchableOpacity>
  
      <Text style={styles.description}>
        Al registrarte, aceptas los{' '}
        <Text style={styles.link} onPress={openTermsModal}>
          Términos de Servicio
        </Text>{' '}
        y la{' '}
        <Text style={styles.link} onPress={openPrivacyModal}>
          Política de Privacidad
        </Text>
        .
      </Text>

      <TermsModal visible={isTermsVisible} onClose={closeTermsModal} />
      <PrivacyModal visible={isPrivacyVisible} onClose={closePrivacyModal} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  button: {
    height: 40,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    width: '80%',
    maxWidth: 250,
    marginTop: -10,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#3c4043',
    fontSize: 14,
    fontFamily: 'barlow-medium',
    letterSpacing: 0.25,
  },
  description: {
    fontSize: 12,
    textAlign: 'center',
    color: '#5f6368',
    marginTop: 15,
    fontFamily: 'barlow-regular',
    paddingHorizontal: 20,
  },
  link: {
    color: '#1a73e8',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});

export default SignInWithGoogle;