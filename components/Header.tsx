import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import useFonts from '@/hooks/useFonts';
import { useUser } from '@clerk/clerk-expo';
import LoadingBall from './LoadingBall';

interface HeaderProps {
  onMenuPress: () => void;
}

export default function Header({ onMenuPress }: HeaderProps) {
  const fontsLoaded = useFonts();
  const { user } = useUser();
  
  if (!fontsLoaded) {
    return <LoadingBall text="Cargando perfil..." />;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={onMenuPress}
      >
        <MaterialIcons name="menu" size={28} color="black" />
      </TouchableOpacity>
      <View style={styles.userInfo}>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            Hola, <Text style={styles.nameText}>{user?.firstName}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: 'barlow-medium',
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  menuButton: {
    marginRight: 20,
    padding: 5,
  },
  greetingText: {
    color: "black", 
    fontSize: 17,
    fontFamily: 'barlow-medium',
  },
  nameText: {
    fontSize: 17,
    color: "black", 
    fontFamily: "barlow-semibold",
  },
});