import { supabase } from '@/lib/supabase';
import { Task, UserPreferences, DailySchedule } from '@/types/database';

export async function generateSchedule(
  tasks: Task[],
  preferences: UserPreferences,
  date: string
): Promise<{ schedule: DailySchedule | null; error: Error | null }> {
  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/schedule-generator`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ tasks, preferences, date }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate schedule');
    }

    const data = await response.json();
    
    return {
      schedule: {
        id: '',
        user_id: '',
        date,
        schedule: data.schedule,
        algorithm_version: data.algorithm_version,
        generated_at: new Date().toISOString(),
        accepted: false,
      },
      error: null,
    };
  } catch (error) {
    return { schedule: null, error: error as Error };
  }
}

export async function saveSchedule(
  userId: string,
  date: string,
  schedule: DailySchedule['schedule'],
  algorithmVersion: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('daily_schedules')
    .upsert({
      user_id: userId,
      date,
      schedule,
      algorithm_version: algorithmVersion,
    }, { onConflict: 'user_id,date' });

  return { error: error as Error | null };
}
