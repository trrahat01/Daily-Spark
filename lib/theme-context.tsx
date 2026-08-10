import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance } from "react-native";
import { ColorScheme, AccentTheme } from "@/theme/colors";
import { makeTheme, AppTheme } from "@/theme/theme";
import {
  SchemePreference,
  getStoredScheme,
  setStoredScheme,
  getStoredAccent,
  setStoredAccent,
} from "./theme-storage";

interface ThemeContextValue {
  theme: AppTheme;
  scheme: SchemePreference;
  effectiveScheme: ColorScheme;
  accent: AccentTheme;
  setScheme: (s: SchemePreference) => void;
  setAccent: (a: AccentTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<SchemePreference>("system");
  const [accent, setAccentState] = useState<AccentTheme>("default");
  const [systemScheme, setSystemScheme] = useState<ColorScheme>(
    Appearance.getColorScheme() === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    getStoredScheme().then(setSchemeState).catch(() => {});
    getStoredAccent().then(setAccentState).catch(() => {});
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme === "dark" || colorScheme === "light") {
        setSystemScheme(colorScheme);
      }
    });
    return () => sub.remove();
  }, []);

  const setScheme = useCallback((s: SchemePreference) => {
    setSchemeState(s);
    setStoredScheme(s).catch(() => {});
  }, []);

  const setAccent = useCallback((a: AccentTheme) => {
    setAccentState(a);
    setStoredAccent(a).catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const effective: ColorScheme =
      scheme === "system" ? systemScheme : scheme;
    return {
      theme: makeTheme(effective, accent),
      scheme,
      effectiveScheme: effective,
      accent,
      setScheme,
      setAccent,
    };
  }, [scheme, systemScheme, accent, setScheme, setAccent]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}