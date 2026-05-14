import { supabase } from '@/lib/supabase';
import { DailySchedule, ScheduleEntry } from '@/types/database';

export async function getSchedule(
  userId: string,
  date: string
): Promise<{ data: DailySchedule | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('daily_schedules')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .limit(1)
    .single();
  // .single() returns error code PGRST116 when no row found — treat as null, not error
  if (error?.code === 'PGRST116') return { data: null, error: null };
  return { data: data as DailySchedule | null, error: error as Error | null };
}

export async function upsertSchedule(
  userId: string,
  date: string,
  schedule: ScheduleEntry[],
  algorithmVersion: string,
  accepted: boolean
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('daily_schedules')
    .upsert(
      {
        user_id: userId,
        date,
        schedule,
        algorithm_version: algorithmVersion,
        generated_at: new Date().toISOString(),
        accepted,
      },
      { onConflict: 'user_id,date' }
    );
  return { error: error as Error | null };
}
