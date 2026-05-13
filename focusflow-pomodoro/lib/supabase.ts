import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { SupportedStorage } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase prefixes all its storage keys with this string.
const SUPABASE_STORAGE_KEY_PREFIX = 'sb-';

/**
 * Storage adapter:
 * - Native (iOS/Android): AsyncStorage — persists across app restarts, correct behaviour.
 * - Web: sessionStorage — scoped to the browser tab, cleared automatically on tab close
 *   and on sign-out. Using localStorage here would leave the session alive across
 *   browser sessions even after the user signs out.
 */
const customStorage: SupportedStorage = {
  getItem: async (key: string) => {
    if (Platform.OS !== 'web') {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return AsyncStorage.getItem(key);
    }
    if (typeof window !== 'undefined') {
      return window.sessionStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS !== 'web') {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return AsyncStorage.setItem(key, value);
    }
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (Platform.OS !== 'web') {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return AsyncStorage.removeItem(key);
    }
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(key);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Forcefully removes all Supabase auth keys from storage.
 * Called during sign-out to guarantee no stale session survives an app
 * restart, even if supabase.auth.signOut() throws or partially fails.
 */
export async function clearAuthStorage(): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const allKeys = await AsyncStorage.getAllKeys();
      const supabaseKeys = allKeys.filter((k) => k.startsWith(SUPABASE_STORAGE_KEY_PREFIX));
      if (supabaseKeys.length > 0) {
        await AsyncStorage.multiRemove(supabaseKeys);
      }
    } else if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key?.startsWith(SUPABASE_STORAGE_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
    }
  } catch (e) {
    console.error('clearAuthStorage error:', e);
  }
}
