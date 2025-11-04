import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isCityId, type CityId } from "@/constants/cities";

type CitySelectionContextValue = {
  selectedCity: CityId | null;
  isLoading: boolean;
  hasHydrated: boolean;
  selectCity: (city: CityId) => Promise<void>;
  clearCity: () => Promise<void>;
};

const CitySelectionContext = createContext<
  CitySelectionContextValue | undefined
>(undefined);

type CityProviderProps = {
  children: React.ReactNode;
};

export const CitySelectionProvider = ({ children }: CityProviderProps) => {
  const [selectedCity, setSelectedCity] = useState<CityId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadStoredCity = async () => {
      try {
        const storedCity = await AsyncStorage.getItem(
          "@millenium:selected-city"
        );

        if (storedCity && isMounted) {
          if (isCityId(storedCity)) {
            setSelectedCity(storedCity);
          } else {
            console.warn(
              "Valor de ciudad almacenado inválido, limpiando preferencia",
              storedCity
            );
            await AsyncStorage.removeItem("@millenium:selected-city");
          }
        }
      } catch (error) {
        console.warn("No se pudo cargar la ciudad almacenada", error);
      } finally {
        if (isMounted) {
          setHasHydrated(true);
          setIsLoading(false);
        }
      }
    };

    loadStoredCity();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectCity = useCallback(async (city: CityId) => {
    setSelectedCity(city);

    try {
      await AsyncStorage.setItem("@millenium:selected-city", city);
    } catch (error) {
      console.warn("No se pudo guardar la ciudad seleccionada", error);
    }
  }, []);

  const clearCity = useCallback(async () => {
    setSelectedCity(null);
    try {
      await AsyncStorage.removeItem("@millenium:selected-city");
    } catch (error) {
      console.warn("No se pudo limpiar la ciudad almacenada", error);
    }
  }, []);

  const value = useMemo(
    () => ({
      selectedCity,
      isLoading,
      hasHydrated,
      selectCity,
      clearCity,
    }),
    [clearCity, hasHydrated, isLoading, selectCity, selectedCity]
  );

  return (
    <CitySelectionContext.Provider value={value}>
      {children}
    </CitySelectionContext.Provider>
  );
};

export const useCitySelection = () => {
  const context = useContext(CitySelectionContext);

  if (!context) {
    throw new Error(
      "useCitySelection debe usarse dentro de un CitySelectionProvider"
    );
  }

  return context;
};
