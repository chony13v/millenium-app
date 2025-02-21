import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useOAuth } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'

import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TermsModal from './modals/TermsModal'
import PrivacyModal from './modals/PrivacyModal'

export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Warm up the android browser to improve UX
    // https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])
}

WebBrowser.maybeCompleteAuthSession()

const SignInWithOAuth = () => {
  useWarmUpBrowser()
  const router = useRouter()

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })

  const onPress = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/home", { scheme: 'milleniumfs' }),
      })

      if (createdSessionId) {
        await setActive!({ session: createdSessionId })
        router.replace('/home')
      } else {

      }
    } catch (err) {
      console.error('OAuth error', err)
    }
  }, [router])

  const openLink = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  }

  const [isTermsVisible, setIsTermsVisible] = useState(false)
  const [isPrivacyVisible, setIsPrivacyVisible] = useState(false)
  
  const openTermsModal = () => setIsTermsVisible(true)
  const closeTermsModal = () => setIsTermsVisible(false)
  
  const openPrivacyModal = () => setIsPrivacyVisible(true)
  const closePrivacyModal = () => setIsPrivacyVisible(false)

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
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  button: {
    height: 40,
    backgroundColor: '#ffffff',
    flexDirection: "row",
    alignItems: "center", 
    justifyContent: "center",
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
})

export default SignInWithOAuth