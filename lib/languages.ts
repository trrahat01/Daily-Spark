/**
 * Supported app languages. Each language value doubles as the value stored in
 * the Supabase `quotes.language` column.
 */
export interface AppLanguage {
  code: string;
  label: string;
  flag: string;
}

export const LANGUAGES: AppLanguage[] = [
  { code: "English", label: "English", flag: "🇬🇧" },
  { code: "Hindi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "Spanish", label: "Español", flag: "🇪🇸" },
  { code: "French", label: "Français", flag: "🇫🇷" },
  { code: "German", label: "Deutsch", flag: "🇩🇪" },
  { code: "Arabic", label: "العربية", flag: "🇸🇦" },
  { code: "Portuguese", label: "Português", flag: "🇧🇷" },
  { code: "Bengali", label: "বাংলা", flag: "🇧🇩" },
  { code: "Urdu", label: "اردو", flag: "🇵🇰" },
  { code: "Indonesian", label: "Bahasa Indonesia", flag: "🇮🇩" },
];

export const DEFAULT_LANGUAGE = "English";
export const LANGUAGE_KEY = "selected_language";