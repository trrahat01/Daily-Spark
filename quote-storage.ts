import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const ADMIN_SESSION_KEY = 'admin_session_active';

// --- Admin Auth ---

export async function isAdminLoggedIn(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
  return val === 'true';
}

export async function setAdminLoggedIn(loggedIn: boolean): Promise<void> {
  await AsyncStorage.setItem(ADMIN_SESSION_KEY, loggedIn ? 'true' : 'false');
}

export async function adminLogin(email: string, pin: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .eq('pin', pin)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    await setAdminLoggedIn(true);
    return true;
  } catch (e) {
    console.error("Login error:", e);
    return false;
  }
}

// --- Quotes & Categories ---

export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data.map((c) => c.name);
}

export async function addQuote(text: string, author: string, category: string) {
  const { error } = await supabase
    .from('quotes')
    .insert([
      {
        text,
        author,
        category,
        created_at: new Date().toISOString(),
      },
    ]);

  if (error) throw error;
}