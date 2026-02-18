import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://yxrfyzqhwuvuxwdfzcjs.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "sb_publishable_Icw6fX7B1sq5k5ar_9eT4g_2DIXPkfI";

const envSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const envSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

const hasValidEnvConfig = Boolean(
  envSupabaseUrl &&
    envSupabaseAnonKey &&
    envSupabaseUrl !== "https://placeholder.supabase.co" &&
    envSupabaseAnonKey !== "placeholder"
);

const supabaseUrl = hasValidEnvConfig ? envSupabaseUrl! : FALLBACK_SUPABASE_URL;
const supabaseAnonKey = hasValidEnvConfig ? envSupabaseAnonKey! : FALLBACK_SUPABASE_ANON_KEY;

if (!hasValidEnvConfig) {
  console.warn(
    "Supabase env vars are missing in this runtime. Using fallback project config. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to avoid environment drift."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
