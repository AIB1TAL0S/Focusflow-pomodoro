import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database';

export interface NewCategoryInput {
  name: string;
  color: string;
  sort_order: number;
}

export async function getCategories(
  userId: string
): Promise<{ data: Category[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });
  return { data: data as Category[] | null, error: error as Error | null };
}

export async function createCategory(
  userId: string,
  input: NewCategoryInput
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('categories')
    .insert({ user_id: userId, ...input });
  return { error: error as Error | null };
}

export async function updateCategory(
  id: string,
  userId: string,
  updates: Partial<Category>
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId);
  return { error: error as Error | null };
}

export async function deleteCategory(
  id: string,
  userId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  return { error: error as Error | null };
}
