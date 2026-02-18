import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://yxrfyzqhwuvuxwdfzcjs.supabase.co";
const supabaseAnonKey = "sb_publishable_Icw6fX7B1sq5k5ar_9eT4g_2DIXPkfI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});
