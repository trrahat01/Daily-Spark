import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const ADMIN_KEY = "admin_logged_in";
const ADMIN_AUTH_MODE_KEY = "admin_auth_mode";
type AdminAuthMode = "supabase_auth" | "legacy_table";

async function persistAdminSession(mode: AdminAuthMode) {
  await AsyncStorage.multiSet([
    [ADMIN_KEY, "true"],
    [ADMIN_AUTH_MODE_KEY, mode],
  ]);
}

async function tryLegacyAdminLogin(email: string, pin: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("admins")
    .select("id")
    .eq("email", email)
    .eq("pin", pin)
    .maybeSingle();

  if (error) {
    const message = error.message ?? "";
    const missingLegacyColumns =
      /admins\.(email|pin)\s+does\s+not\s+exist/i.test(message) ||
      /Could not find the '(email|pin)' column/i.test(message);

    if (missingLegacyColumns) {
      return false;
    }

    throw new Error(message);
  }

  if (!data) {
    return false;
  }

  await persistAdminSession("legacy_table");
  return true;
}

export async function isAdminLoggedIn() {
  const val = await AsyncStorage.getItem(ADMIN_KEY);
  if (val !== "true") return false;

  const mode = await AsyncStorage.getItem(ADMIN_AUTH_MODE_KEY);
  if (mode === "legacy_table") {
    return true;
  }

  // For Supabase Auth mode, verify we still have a valid session.
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    await AsyncStorage.multiRemove([ADMIN_KEY, ADMIN_AUTH_MODE_KEY]);
    return false;
  }
  return true;
}

export async function setAdminLoggedIn(val: boolean) {
  if (val) {
    await persistAdminSession("supabase_auth");
  } else {
    await AsyncStorage.multiRemove([ADMIN_KEY, ADMIN_AUTH_MODE_KEY]);
    await supabase.auth.signOut();
  }
}

export async function adminLogin(email: string, pin: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPin = pin.trim();

  // 1. Try Supabase Auth first (email + pin-as-password setup).
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: normalizedPin,
  });

  if (error) {
    const message = error.message ?? "Login failed";
    if (/invalid login credentials/i.test(message)) {
      return tryLegacyAdminLogin(normalizedEmail, normalizedPin);
    }
    console.log("Supabase Auth Error:", error);
    throw new Error(message);
  }

  if (!data.session?.user) {
    throw new Error("No session created.");
  }

  // 2. Check if this signed-in user exists in the admins table.
  const { data: adminData, error: adminError } = await supabase
    .from("admins")
    .select("id")
    .eq("id", data.session.user.id)
    .maybeSingle();

  if (adminError) {
    await supabase.auth.signOut();
    console.log("Admin Table Error:", adminError);
    throw new Error(adminError.message ?? "Admin verification failed.");
  }

  if (!adminData) {
    await supabase.auth.signOut();
    return tryLegacyAdminLogin(normalizedEmail, normalizedPin);
  }

  await persistAdminSession("supabase_auth");
  return true;
}

// --- Quote & Favorites Logic ---

export interface Quote {
  id: string;
  text: string;
  author: string;
  category: string;
  image_url?: string | null;
  created_at?: string;
  is_favorite?: boolean;
  liked?: boolean;
}

const FAVORITES_KEY = "user_favorites";

async function getFavoriteIds(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(FAVORITES_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function getQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const favIds = await getFavoriteIds();
  
  return (data || []).map((q: any) => ({
    ...q,
    is_favorite: favIds.includes(q.id),
    liked: favIds.includes(q.id),
  }));
}

export async function getCategories(): Promise<string[]> {
  // 1. Try to get from explicit 'categories' table
  const { data, error } = await supabase
    .from("categories")
    .select("name")
    .order("name");

  if (!error && data) {
    return data.map((c: any) => c.name);
  }

  // 2. Fallback: derive from 'quotes' table if 'categories' table is missing
  const { data: quotesData } = await supabase
    .from("quotes")
    .select("category");

  const categories = Array.from(new Set((quotesData || []).map((item: any) => item.category))).filter(Boolean);
  return categories.sort();
}

export async function addCategory(name: string): Promise<void> {
  const { error } = await supabase.from("categories").insert([{ name }]);
  if (error) throw error;
}

export async function deleteCategory(name: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("name", name);
  if (error) throw error;
}

export async function getFavorites(): Promise<Quote[]> {
  const favIds = await getFavoriteIds();
  if (favIds.length === 0) return [];

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .in("id", favIds);

  if (error) throw error;

  return (data || []).map((q: any) => ({
    ...q,
    is_favorite: true,
    liked: true,
  }));
}

export async function toggleLike(id: string): Promise<void> {
  const favIds = await getFavoriteIds();
  let newFavIds;
  
  if (favIds.includes(id)) {
    newFavIds = favIds.filter((favId) => favId !== id);
  } else {
    newFavIds = [...favIds, id];
  }
  
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavIds));
}

export async function addQuote(text: string, author: string, category: string): Promise<void> {
  const { error } = await supabase.from("quotes").insert([
    {
      text,
      author,
      category,
    },
  ]);

  if (error) throw error;
}

export async function addQuotesBulk(
  quotes: { text: string; author: string; category: string }[]
): Promise<number> {
  if (quotes.length === 0) {
    return 0;
  }

  const payload = quotes.map((quote) => ({
    text: quote.text,
    author: quote.author,
    category: quote.category,
  }));

  const { error } = await supabase.from("quotes").insert(payload);
  if (error) throw error;

  return payload.length;
}

export async function updateQuote(
  id: string,
  text: string,
  author: string,
  category: string
): Promise<void> {
  const { error } = await supabase
    .from("quotes")
    .update({ text, author, category })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteQuote(id: string): Promise<void> {
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) throw error;
}
