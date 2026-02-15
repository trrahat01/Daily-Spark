import { supabase } from "./supabase";

export interface AdSettings {
  id: string;
  banner_enabled: boolean;
  interstitial_enabled: boolean;
  banner_id?: string;
  interstitial_id?: string;
}

export async function getAdSettings(): Promise<AdSettings | null> {
  const { data, error } = await supabase
    .from("ad_settings")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching ad settings:", error);
    return null;
  }
  return data;
}

export async function updateAdSettings(settings: Partial<AdSettings>) {
  // We update the single row that exists
  const { error } = await supabase
    .from("ad_settings")
    .update(settings)
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Updates all rows (there should only be one)

  if (error) throw error;
}