import { View, Text, StyleSheet, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';

export default function JoinPage() {
  const { user } = useUser();
  const navigation = useNavigation();
  const [authorized, setAuthorized] = useState(false);
  const authorizedEmails = ['chony128@gmail.com', 'vasconez13v@gmail.com'];

  useEffect(() => {
    const userEmail = user?.primaryEmailAddress?.emailAddress || '';
    if (authorizedEmails.includes(userEmail)) {
      setAuthorized(true);
    } else {
      Alert.alert(
        "Acceso Restringido",
        "Si eres uno de los seleccionados para viajar a Argentina, tendrás acceso exclusivo a este contenido.\n\n¡No olvides inscribirte en los torneos selectivos si aún no lo has hecho!\n\n¡Te deseamos mucha suerte!",
        [
          {
            text: "OK",
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: '(call)' as never }],
            }),
          },
        ]
      );
    }
  }, [user]);

  if (!authorized) {
    return null; 
  }

  return (
    <View style={styles.container}>
      <Text style={styles.joinText}>join</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f2f2f2',
    padding: 20,
  },
  joinText: {
    fontSize: 20,
    color: '#333333',
  },
});