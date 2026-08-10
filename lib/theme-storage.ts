import AsyncStorage from "@react-native-async-storage/async-storage";
import { ColorScheme, AccentTheme } from "@/theme/colors";

const SCHEME_KEY = "ds_scheme";
const ACCENT_KEY = "ds_accent";

export type SchemePreference = ColorScheme | "system";

export async function getStoredScheme(): Promise<SchemePreference> {
  try {
    const v = (await AsyncStorage.getItem(SCHEME_KEY)) as SchemePreference | null;
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export async function setStoredScheme(s: SchemePreference): Promise<void> {
  try {
    await AsyncStorage.setItem(SCHEME_KEY, s);
  } catch {}
}

export async function getStoredAccent(): Promise<AccentTheme> {
  try {
    const v = (await AsyncStorage.getItem(ACCENT_KEY)) as AccentTheme | null;
    return v || "default";
  } catch {
    return "default";
  }
}

export async function setStoredAccent(a: AccentTheme): Promise<void> {
  try {
    await AsyncStorage.setItem(ACCENT_KEY, a);
  } catch {}
}