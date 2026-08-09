import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANGUAGE_KEY,
} from "./languages";

interface LanguageContextValue {
  language: string;
  setLanguage: (code: string) => void;
  languages: AppLanguage[];
}

const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  languages: LANGUAGES,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>(DEFAULT_LANGUAGE);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((value) => {
        if (value) setLanguageState(value);
      })
      .catch(() => {
        // ignore storage errors
      });
  }, []);

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
    AsyncStorage.setItem(LANGUAGE_KEY, code).catch(() => {
      // ignore storage errors
    });
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, languages: LANGUAGES }),
    [language, setLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}