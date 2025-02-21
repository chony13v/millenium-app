import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

export default function useFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'outfit-bold': require('../assets/fonts/Outfit-Bold.ttf'),
        'outfit-medium': require('../assets/fonts/Outfit-Medium.ttf'),
        'outfit-regular': require('../assets/fonts/Outfit-Regular.ttf'),
        'bebas-regular': require('../assets/fonts/BebasNeue-Regular.ttf'),
        'oswald': require('../assets/fonts/Oswald-VariableFont_wght.ttf'),
        'barlow-light': require('../assets/fonts/BarlowSemiCondensed-Light.ttf'),
        'barlow-medium': require('../assets/fonts/BarlowCondensed-Medium.ttf'),
        'barlow-regular': require('../assets/fonts/BarlowCondensed-Regular.ttf'),
        'barlow-semibold': require('../assets/fonts/BarlowCondensed-SemiBold.ttf'),
      });
      setFontsLoaded(true);
    }

    loadFonts();
  }, []);

  return fontsLoaded;
}