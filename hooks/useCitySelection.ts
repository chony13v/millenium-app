import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
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
  children: ReactNode;
  identityKey?: string | null;
};

const getStorageKey = (identityKey?: string | null) =>
  identityKey
    ? `@millenium:selected-city:${identityKey}`
    : "@millenium:selected-city";

export const CitySelectionProvider = ({
  children,
  identityKey,
}: CityProviderProps): ReactElement => {
  const [selectedCity, setSelectedCity] = useState<CityId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);
  const storageKey = useMemo(() => getStorageKey(identityKey), [identityKey]);

  useEffect(() => {
    let isMounted = true;

    // Al cambiar de usuario limpiamos el estado local y recargamos desde su clave
    setSelectedCity(null);
    setIsLoading(true);
    setHasHydrated(false);

    const loadStoredCity = async () => {
      try {
        const storedCity = await AsyncStorage.getItem(storageKey);

        if (storedCity && isMounted) {
          if (isCityId(storedCity)) {
            setSelectedCity(storedCity);
          } else {
            console.warn(
              "Valor de ciudad almacenado inválido, limpiando preferencia",
              storedCity
            );
            await AsyncStorage.removeItem(storageKey);
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
  }, [storageKey]);

  const selectCity = useCallback(
    async (city: CityId) => {
      setSelectedCity(city);

      try {
        await AsyncStorage.setItem(storageKey, city);
      } catch (error) {
        console.warn("No se pudo guardar la ciudad seleccionada", error);
      }
    },
    [storageKey]
  );

  const clearCity = useCallback(async () => {
    setSelectedCity(null);
    try {
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("No se pudo limpiar la ciudad almacenada", error);
    }
  }, [storageKey]);

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

  return createElement(CitySelectionContext.Provider, { value }, children);
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
