import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const ADMIN_KEY = "admin_logged_in";

export async function isAdminLoggedIn() {
  const val = await AsyncStorage.getItem(ADMIN_KEY);
  if (val !== "true") return false;

  // Verify we actually have a valid Supabase session
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    return false;
  }
  return true;
}

export async function setAdminLoggedIn(val: boolean) {
  if (val) {
    await AsyncStorage.setItem(ADMIN_KEY, "true");
  } else {
    await AsyncStorage.removeItem(ADMIN_KEY);
    await supabase.auth.signOut();
  }
}

export async function adminLogin(email: string, pin: string) {
  // 1. Attempt to sign in with Supabase Auth
  // We treat the "PIN" input as the Password.
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: pin,
  });

  if (error) {
    console.log("Supabase Auth Error:", error);
    throw new Error(error.message);
  }

  if (!data.session?.user) {
    throw new Error("No session created.");
  }

  // 2. Check if this user is in the 'admins' table
  const { data: adminData, error: adminError } = await supabase
    .from("admins")
    .select("*")
    .eq("id", data.session.user.id)
    .single();

  if (adminError || !adminData) {
    console.log("Admin Table Error:", adminError);
    await supabase.auth.signOut();
    return false;
  }

  await setAdminLoggedIn(true);
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