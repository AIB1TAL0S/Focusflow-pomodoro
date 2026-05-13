import { supabase, clearAuthStorage } from './supabase';

/**
 * Client-side auth API module.
 * Wraps Supabase auth operations with local cleanup.
 */

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, displayName?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
}

/**
 * Sign out with full local cleanup.
 *
 * Flow:
 *  1. Call supabase.auth.signOut({ scope: 'local' }) to clear memory + storage.
 *  2. Force-wipe all Supabase keys from AsyncStorage/sessionStorage.
 */
export async function signOut(): Promise<{ error: Error | null }> {
  // 1. Clear Supabase local state (memory + storage)
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (e) {
    console.warn('Supabase local signOut warning:', e);
  }

  // 2. Belt-and-suspenders: wipe every sb-* key from storage
  await clearAuthStorage();

  return { error: null };
}
