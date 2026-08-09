import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://yxrfyzqhwuvuxwdfzcjs.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4cmZ5enFod3V2dXh3ZGZ6Y2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDY4MTksImV4cCI6MjA4NjYyMjgxOX0.p2z3uOYX7SHy-5OIdwJrS98Tu8yYRCGwo7srXTedsao";

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
