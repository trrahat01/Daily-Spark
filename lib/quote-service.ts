import AsyncStorage from "@react-native-async-storage/async-storage";
import { Quote, BUNDLED_QUOTES } from "@/data/quotes";
import { getQuotes as fetchRemoteQuotes, getCategories as fetchRemoteCategories } from "@/lib/quote-storage";

const CACHE_KEY = "ds_quote_cache";
const DAY_KEY = "ds_quote_day";
const DAILY_KEY = "ds_quote_daily";
const CATS_KEY = "ds_categories_cache";

/** --- cache helpers -------------------------------------------------- */

export async function saveQuotesToCache(quotes: Quote[]): Promise<void> {
  try {
    const json = JSON.stringify(quotes);
    if (json.length > 1_000_000) {
      // Keep the cache bounded for the offline fallback.
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(quotes.slice(0, 5000)));
    } else {
      await AsyncStorage.setItem(CACHE_KEY, json);
    }
  } catch {}
}

export async function loadQuotesFromCache(): Promise<Quote[]> {
  try {
    const json = await AsyncStorage.getItem(CACHE_KEY);
    const parsed = json ? JSON.parse(json) : null;
    return Array.isArray(parsed) ? (parsed as Quote[]) : [];
  } catch {
    return [];
  }
}

async function clearCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    await AsyncStorage.removeItem(CATS_KEY);
  } catch {}
}

/** --- data access (offline-first) ------------------------------------ */

export async function getQuotes(language?: string): Promise<Quote[]> {
  // 1) last good cache (instant + offline)
  const cached = await loadQuotesFromCache();
  if (cached.length) return cached;
  // 2) remote, then cache it
  try {
    const remote = await fetchRemoteQuotes(language);
    if (remote && remote.length) {
      await saveQuotesToCache(remote);
      return remote;
    }
  } catch {}
  // 3) bundled fallback
  return BUNDLED_QUOTES;
}

export async function syncQuotes(language?: string): Promise<Quote[]> {
  try {
    const remote = await fetchRemoteQuotes(language);
    if (remote && remote.length) {
      await saveQuotesToCache(remote);
      return remote;
    }
  } catch {}
  const cached = await loadQuotesFromCache();
  return cached.length ? cached : BUNDLED_QUOTES;
}

export async function getQuoteById(id: string): Promise<Quote | undefined> {
  if (!id) return undefined;
  const all = await getQuotes();
  return all.find((item) => String(item.id) === String(id));
}

export async function getQuotesByCategory(category: string): Promise<Quote[]> {
  const all = await getQuotes();
  const cat = (category || "").toLowerCase();
  return all.filter((item) => (item.category || "").toLowerCase() === cat);
}

export async function getQuotesByAuthor(author: string): Promise<Quote[]> {
  const all = await getQuotes();
  const a = (author || "").toLowerCase();
  return all.filter((item) => (item.author || "").toLowerCase() === a);
}

export async function getFeaturedQuotes(limit = 20): Promise<Quote[]> {
  const all = await getQuotes();
  const featured = all.filter((q) => q.featured);
  if (featured.length) return featured.slice(0, limit);
  return all.slice(0, limit);
}

export async function getCategories(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(CATS_KEY);
    if (json) {
      const arr = JSON.parse(json);
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch {}
  let cats: string[] = [];
  try {
    const remoteCats = await fetchRemoteCategories();
    if (remoteCats && remoteCats.length) {
      cats = remoteCats;
      await AsyncStorage.setItem(CATS_KEY, JSON.stringify(cats)).catch(() => {});
    }
  } catch {}
  if (!cats.length) {
    cats = Array.from(new Set(BUNDLED_QUOTES.map((q) => q.category))).filter(Boolean);
  }
  return cats.sort();
}

export async function getAuthors(): Promise<string[]> {
  const all = await getQuotes();
  return Array.from(new Set(all.map((q) => q.author || "Unknown"))).sort();
}

export async function searchQuotes(query: string): Promise<Quote[]> {
  const all = await getQuotes();
  const term = (query || "").trim().toLowerCase();
  if (!term) return [];
  return all.filter((item) => {
    return (
      (item.text || "").toLowerCase().includes(term) ||
      (item.author || "").toLowerCase().includes(term) ||
      (item.category || "").toLowerCase().includes(term)
    );
  });
}

/** --- deterministic daily quote -------------------------------------- */

function dayIndex(target: string): number {
  let total = 0;
  for (let i = 0; i < target.length; i += 1) total = (total * 31 + target.charCodeAt(i)) % 100000;
  return total;
}

export async function getDailyQuote(): Promise<Quote> {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const dayKey = `${y}-${m}-${d}`;

  try {
    const [storedDay, storedQuote] = await Promise.all([
      AsyncStorage.getItem(DAY_KEY),
      AsyncStorage.getItem(DAILY_KEY),
    ]);
    if (storedDay === dayKey && storedQuote) {
      const parsed = JSON.parse(storedQuote);
      if (parsed && parsed.text) return parsed as Quote;
    }
  } catch {}

  const all = await getQuotes();
  const pool = all.length ? all : BUNDLED_QUOTES;
  const quote = pool[dayIndex(dayKey) % pool.length];
  try {
    await AsyncStorage.multiSet([
      [DAY_KEY, dayKey],
      [DAILY_KEY, JSON.stringify(quote)],
    ]);
  } catch {}
  return quote;
}

export { clearCache as clearQuoteCache };