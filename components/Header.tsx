import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import useFonts from '@/hooks/useFonts';
import { useUser } from '@clerk/clerk-expo';
import LoadingBall from './LoadingBall';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  onMenuPress: () => void;
}

export default function Header({ onMenuPress }: HeaderProps) {
  const fontsLoaded = useFonts();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  
  if (!fontsLoaded) {
    return <LoadingBall text="Cargando perfil..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 5 }]}>
      
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
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    paddingBottom: -10, 
    zIndex: 15,
    elevation: 15,
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
    padding: 10,
  },
  greetingText: {
    color: "black", 
    fontSize: 17,
    fontFamily: 'barlow-semibold',
  },
  nameText: {
    fontSize: 17,
    color: "black", 
    fontFamily: "barlow-semibold",
  },
});
