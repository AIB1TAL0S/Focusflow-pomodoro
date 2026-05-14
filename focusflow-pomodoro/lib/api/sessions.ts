import { supabase } from '@/lib/supabase';
import { PomodoroSession, Task } from '@/types/database';

export interface NewSessionInput {
  user_id: string;
  task_id: string;
  start_time: string;
  planned_duration: number;
  session_number: number;
}

export interface CompleteSessionResult {
  updatedTask: Task | null;
  milestoneHit: boolean;
  error: Error | null;
}

type CompleteSessionPayload = {
  task: Task | null;
  milestone_hit: boolean;
};

function isCompleteSessionPayload(
  value: CompleteSessionPayload | Task | null
): value is CompleteSessionPayload {
  return Boolean(value && 'milestone_hit' in value);
}

/**
 * Atomically completes a pomodoro session and updates the task's pomodoro count
 * via a single server-side RPC call. This avoids race conditions from two
 * separate client-side UPDATE statements.
 *
 * The DB function:
 *   1. Marks the session as completed with end_time + actual_duration
 *   2. Increments task.completed_pomodoros only when the long-break cycle is
 *      fulfilled
 *   3. Leaves estimated_pomodoros unchanged
 *   4. Marks the task completed once completed_pomodoros reaches
 *      estimated_pomodoros
 *   5. Returns the updated task row + milestone_hit flag
 */
export async function completeSession(
  sessionId: string,
  taskId: string,
  actualDuration: number,
  pomodorosBeforeLong: number
): Promise<CompleteSessionResult> {
  const { data, error } = await supabase.rpc('complete_pomodoro_session', {
    p_session_id: sessionId,
    p_task_id: taskId,
    p_actual_duration: actualDuration,
    p_end_time: new Date().toISOString(),
    p_pomodoros_before_long: pomodorosBeforeLong,
  });

  const payload = data as CompleteSessionPayload | Task | null;
  const updatedTask = isCompleteSessionPayload(payload) ? payload.task : payload;
  const milestoneHit = isCompleteSessionPayload(payload) ? payload.milestone_hit : false;

  return {
    updatedTask: error ? null : updatedTask,
    milestoneHit: error ? false : milestoneHit,
    error: error as Error | null,
  };
}

export async function getSessions(
  userId: string,
  since: string
): Promise<{ data: PomodoroSession[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('*, task:tasks(title)')
    .eq('user_id', userId)
    .gte('start_time', `${since}T00:00:00.000Z`)
    .order('start_time', { ascending: false });
  return { data: data as PomodoroSession[] | null, error: error as Error | null };
}

export async function deleteSessions(
  userId: string,
  since: string,
  status?: PomodoroSession['status']
): Promise<{ error: Error | null }> {
  let query = supabase
    .from('pomodoro_sessions')
    .delete()
    .eq('user_id', userId)
    .gte('start_time', `${since}T00:00:00.000Z`);

  if (status) {
    query = query.eq('status', status);
  }

  const { error } = await query;
  return { error: error as Error | null };
}

export async function getTodayCount(
  userId: string
): Promise<{ count: number; error: Error | null }> {
  const today = new Date().toISOString().split('T')[0];
  const { count, error } = await supabase
    .from('pomodoro_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('start_time', `${today}T00:00:00.000Z`);
  return { count: count || 0, error: error as Error | null };
}

export async function getAllSessions(
  userId: string,
  since: string
): Promise<{ data: PomodoroSession[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', since);
  return { data: data as PomodoroSession[] | null, error: error as Error | null };
}

export async function getSessionsWithCategory(
  userId: string,
  since: string
): Promise<{ data: PomodoroSession[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('*, task:tasks(title, category:categories(name, color))')
    .eq('user_id', userId)
    .gte('start_time', since);
  return { data: data as PomodoroSession[] | null, error: error as Error | null };
}

export async function createSession(
  input: NewSessionInput
): Promise<{ data: PomodoroSession | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .insert(input)
    .select()
    .single();
  return { data: data as PomodoroSession | null, error: error as Error | null };
}

export async function updateSession(
  id: string,
  updates: Partial<PomodoroSession>
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('pomodoro_sessions')
    .update(updates)
    .eq('id', id);
  return { error: error as Error | null };
}
