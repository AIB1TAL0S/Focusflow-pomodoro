import { supabase } from '@/lib/supabase';
import { Task } from '@/types/database';

export interface NewTaskInput {
  title: string;
  description: string;
  priority: number;
  energy_level: 'low' | 'medium' | 'high';
  category_id: string | null;
  focus_tags: string[];
  deadline: string | null;
  estimated_pomodoros?: number;
}

export async function getTasks(
  userId: string
): Promise<{ data: Task[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, category:categories(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data: data as Task[] | null, error: error as Error | null };
}

export async function getActiveTasks(
  userId: string
): Promise<{ data: Task[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, category:categories(*)')
    .eq('user_id', userId)
    .in('status', ['pending', 'in_progress'])
    .order('priority', { ascending: false });
  return { data: data as Task[] | null, error: error as Error | null };
}

export async function createTask(
  userId: string,
  input: NewTaskInput
): Promise<{ data: Task | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, ...input })
    .select()
    .single();
  return { data: data as Task | null, error: error as Error | null };
}

export async function updateTask(
  id: string,
  updates: Partial<Task>
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  return { error: error as Error | null };
}

export async function deleteTask(
  id: string,
  userId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  return { error: error as Error | null };
}
