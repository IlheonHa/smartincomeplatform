
/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Use environment variables with fallbacks
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pleuqhqpvcsmflehmvyy.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__3_VIZ6dkhxqvhAioUJ2Hg_8QaPe1Aw';

// Validate the URL and Key
const isValidUrl = supabaseUrl && supabaseUrl.startsWith('https://');
const isValidKey = supabaseAnonKey && supabaseAnonKey.length > 20;

if (!isValidUrl || !isValidKey) {
  console.warn('[Supabase] Invalid configuration detected. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    autoRefreshToken: true,
  }
});

// Helper to check connection
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('[Supabase] Connection successful');
    return true;
  } catch (err) {
    console.error('[Supabase] Connection failed:', err);
    return false;
  }
};
