import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { Quote, SEED_QUOTES, DEFAULT_CATEGORIES } from "./data";

const QUOTES_KEY = "@daily_spark_quotes";
const CATEGORIES_KEY = "@daily_spark_categories";
const ADMIN_LOGGED_IN_KEY = "@daily_spark_admin";
const SEEDED_KEY = "@daily_spark_seeded";

async function ensureSeeded(): Promise<void> {
  const seeded = await AsyncStorage.getItem(SEEDED_KEY);
  if (seeded) return;

  const quotes: Quote[] = SEED_QUOTES.map((q) => ({
    ...q,
    id: Crypto.randomUUID(),
    liked: false,
    createdAt: new Date().toISOString(),
  }));

  await AsyncStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
  await AsyncStorage.setItem(SEEDED_KEY, "true");
}

export async function getQuotes(): Promise<Quote[]> {
  await ensureSeeded();
  const raw = await AsyncStorage.getItem(QUOTES_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function getQuotesByCategory(category: string): Promise<Quote[]> {
  const all = await getQuotes();
  if (category === "All") return all;
  return all.filter((q) => q.category === category);
}

export async function getFavorites(): Promise<Quote[]> {
  const all = await getQuotes();
  return all.filter((q) => q.liked);
}

export async function toggleLike(id: string): Promise<Quote[]> {
  const all = await getQuotes();
  const updated = all.map((q) =>
    q.id === id ? { ...q, liked: !q.liked } : q
  );
  await AsyncStorage.setItem(QUOTES_KEY, JSON.stringify(updated));
  return updated;
}

export async function addQuote(
  text: string,
  author: string,
  category: string
): Promise<Quote> {
  const all = await getQuotes();
  const newQuote: Quote = {
    id: Crypto.randomUUID(),
    text,
    author,
    category,
    liked: false,
    createdAt: new Date().toISOString(),
  };
  all.unshift(newQuote);
  await AsyncStorage.setItem(QUOTES_KEY, JSON.stringify(all));
  return newQuote;
}

export async function addQuotesBulk(
  quotes: { text: string; author: string; category: string }[]
): Promise<number> {
  const all = await getQuotes();
  const newQuotes: Quote[] = quotes.map((q) => ({
    ...q,
    id: Crypto.randomUUID(),
    liked: false,
    createdAt: new Date().toISOString(),
  }));
  const combined = [...newQuotes, ...all];
  await AsyncStorage.setItem(QUOTES_KEY, JSON.stringify(combined));
  return newQuotes.length;
}

export async function updateQuote(
  id: string,
  text: string,
  author: string,
  category: string
): Promise<void> {
  const all = await getQuotes();
  const updated = all.map((q) =>
    q.id === id ? { ...q, text, author, category } : q
  );
  await AsyncStorage.setItem(QUOTES_KEY, JSON.stringify(updated));
}

export async function deleteQuote(id: string): Promise<void> {
  const all = await getQuotes();
  const filtered = all.filter((q) => q.id !== id);
  await AsyncStorage.setItem(QUOTES_KEY, JSON.stringify(filtered));
}

export async function getCategories(): Promise<string[]> {
  await ensureSeeded();
  const raw = await AsyncStorage.getItem(CATEGORIES_KEY);
  if (!raw) return DEFAULT_CATEGORIES;
  return JSON.parse(raw);
}

export async function addCategory(name: string): Promise<string[]> {
  const cats = await getCategories();
  if (cats.includes(name)) return cats;
  const updated = [...cats, name];
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  return updated;
}

export async function deleteCategory(name: string): Promise<string[]> {
  const cats = await getCategories();
  const updated = cats.filter((c) => c !== name);
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  return updated;
}

export async function setAdminLoggedIn(loggedIn: boolean): Promise<void> {
  if (loggedIn) {
    await AsyncStorage.setItem(ADMIN_LOGGED_IN_KEY, "true");
  } else {
    await AsyncStorage.removeItem(ADMIN_LOGGED_IN_KEY);
  }
}

export async function isAdminLoggedIn(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ADMIN_LOGGED_IN_KEY);
  return val === "true";
}
