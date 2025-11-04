import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type CitySelectionContextValue = {
  selectedCity: string | null;
  isLoading: boolean;
  selectCity: (city: string) => Promise<void>;
  clearCity: () => Promise<void>;
};

const CitySelectionContext =
  createContext<CitySelectionContextValue | undefined>(undefined);

type CityProviderProps = {
  children: React.ReactNode;
};

export const CitySelectionProvider = ({ children }: CityProviderProps) => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const selectCity = useCallback(async (city: string) => {
    setSelectedCity(city);
  }, []);

  const clearCity = useCallback(async () => {
    setSelectedCity(null);
  }, []);

  const value = useMemo(
    () => ({ selectedCity, isLoading: false, selectCity, clearCity }),
    [clearCity, selectCity, selectedCity]
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