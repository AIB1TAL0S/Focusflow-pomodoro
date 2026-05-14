import { supabase } from '@/lib/supabase';
import { Profile, UserPreferences } from '@/types/database';

export async function getProfile(
  userId: string
): Promise<{ data: Profile | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data: data as Profile | null, error: error as Error | null };
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  return { error: error as Error | null };
}

export async function getPreferences(
  userId: string
): Promise<{ data: UserPreferences | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data: data as UserPreferences | null, error: error as Error | null };
}

export async function updatePreferences(
  userId: string,
  updates: Partial<UserPreferences>
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('user_preferences')
    .update(updates)
    .eq('user_id', userId);
  return { error: error as Error | null };
}
