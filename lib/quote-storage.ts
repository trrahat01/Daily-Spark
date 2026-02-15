import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { Quote, Category } from "./data";

const LIKED_KEY = "@daily_spark_liked_ids";
const ADMIN_LOGGED_IN_KEY = "@daily_spark_admin";

async function getLikedIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(LIKED_KEY);
  if (!raw) return new Set();
  return new Set(JSON.parse(raw));
}

async function saveLikedIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(LIKED_KEY, JSON.stringify([...ids]));
}

export async function getQuotes(): Promise<(Quote & { liked: boolean })[]> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  const likedIds = await getLikedIds();
  return (data || []).map((q: Quote) => ({
    ...q,
    liked: likedIds.has(q.id),
  }));
}

export async function getQuotesByCategory(
  category: string
): Promise<(Quote & { liked: boolean })[]> {
  const all = await getQuotes();
  if (category === "All") return all;
  return all.filter((q) => q.category === category);
}

export async function getFavorites(): Promise<(Quote & { liked: boolean })[]> {
  const all = await getQuotes();
  return all.filter((q) => q.liked);
}

export async function toggleLike(id: string): Promise<void> {
  const likedIds = await getLikedIds();
  if (likedIds.has(id)) {
    likedIds.delete(id);
  } else {
    likedIds.add(id);
  }
  await saveLikedIds(likedIds);
}

export async function addQuote(
  text: string,
  author: string,
  category: string
): Promise<Quote> {
  const { data, error } = await supabase
    .from("quotes")
    .insert({ text, author, category })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addQuotesBulk(
  quotes: { text: string; author: string; category: string }[]
): Promise<number> {
  const { data, error } = await supabase.from("quotes").insert(quotes).select();

  if (error) throw error;
  return data?.length || 0;
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

export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("name")
    .order("name");

  if (error) throw error;
  return (data || []).map((c: { name: string }) => c.name);
}

export async function addCategory(name: string): Promise<string[]> {
  const { error } = await supabase.from("categories").insert({ name });

  if (error) throw error;
  return getCategories();
}

export async function deleteCategory(name: string): Promise<string[]> {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("name", name);

  if (error) throw error;
  return getCategories();
}

export async function adminLogin(
  email: string,
  pin: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("admins")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .eq("pin", pin.trim())
    .maybeSingle();

  if (error) throw error;
  if (data) {
    await AsyncStorage.setItem(ADMIN_LOGGED_IN_KEY, "true");
    return true;
  }
  return false;
}

export async function isAdminLoggedIn(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ADMIN_LOGGED_IN_KEY);
  return val === "true";
}

export async function setAdminLoggedIn(loggedIn: boolean): Promise<void> {
  if (loggedIn) {
    await AsyncStorage.setItem(ADMIN_LOGGED_IN_KEY, "true");
  } else {
    await AsyncStorage.removeItem(ADMIN_LOGGED_IN_KEY);
  }
}
