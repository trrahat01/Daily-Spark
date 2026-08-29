/**
 * Supported app languages. Each language value doubles as the value stored in
 * the Supabase `quotes.language` column.
 *
 * Every quote is native to a language/country — we never machine-translate an
 * English quote into another language. `country` identifies the home country of
 * the language, `nativeName` is the original language name, and `langCode` is
 * the ISO-639 short code used for the `original_language` field.
 */
export interface AppLanguage {
  code: string;
  /** Display name for the picker (the language's own name). */
  label: string;
  flag: string;
  /** Home country the language/quotes belong to (for country filtering). */
  country: string;
  /** Country code, e.g. "BD", "SA". */
  countryCode: string;
  /** ISO-639 language code, e.g. "bn", "ar" — stored as original_language. */
  langCode: string;
  /** The original/native language name (never a translated English quote). */
  nativeName: string;
}

export const LANGUAGES: AppLanguage[] = [
  { code: "English", label: "English", flag: "🇺🇸", country: "United States", countryCode: "US", langCode: "en", nativeName: "English" },
  { code: "Hindi", label: "हिन्दी", flag: "🇮🇳", country: "India", countryCode: "IN", langCode: "hi", nativeName: "Hindi" },
  { code: "Spanish", label: "Español", flag: "🇪🇸", country: "Spain", countryCode: "ES", langCode: "es", nativeName: "Spanish" },
  { code: "French", label: "Français", flag: "🇫🇷", country: "France", countryCode: "FR", langCode: "fr", nativeName: "French" },
  { code: "German", label: "Deutsch", flag: "🇩🇪", country: "Germany", countryCode: "DE", langCode: "de", nativeName: "German" },
  { code: "Arabic", label: "العربية", flag: "🇸🇦", country: "Saudi Arabia", countryCode: "SA", langCode: "ar", nativeName: "Arabic" },
  { code: "Portuguese", label: "Português", flag: "🇧🇷", country: "Brazil", countryCode: "BR", langCode: "pt", nativeName: "Portuguese" },
  { code: "Bengali", label: "বাংলা", flag: "🇧🇩", country: "Bangladesh", countryCode: "BD", langCode: "bn", nativeName: "Bangla" },
  { code: "Urdu", label: "اردو", flag: "🇵🇰", country: "Pakistan", countryCode: "PK", langCode: "ur", nativeName: "Urdu" },
  { code: "Indonesian", label: "Bahasa Indonesia", flag: "🇮🇩", country: "Indonesia", countryCode: "ID", langCode: "id", nativeName: "Indonesian" },
  { code: "Japanese", label: "日本語", flag: "🇯🇵", country: "Japan", countryCode: "JP", langCode: "ja", nativeName: "Japanese" },
  { code: "Korean", label: "한국어", flag: "🇰🇷", country: "South Korea", countryCode: "KR", langCode: "ko", nativeName: "Korean" },
  { code: "Chinese", label: "中文", flag: "🇨🇳", country: "China", countryCode: "CN", langCode: "zh", nativeName: "Chinese" },
];

export const DEFAULT_LANGUAGE = "English";
export const LANGUAGE_KEY = "selected_language";

/** Look up a language entry by its stored code. */
export function getLanguage(code: string): AppLanguage {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}