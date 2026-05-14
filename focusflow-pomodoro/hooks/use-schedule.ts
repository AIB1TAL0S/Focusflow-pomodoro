import { useState, useCallback } from 'react';
import { Task, DailySchedule, UserPreferences } from '@/types/database';
import { getSchedule, upsertSchedule } from '@/lib/api';
import { generateSchedule } from '@/lib/schedule';

interface UseScheduleResult {
  todaySchedule: DailySchedule | null;
  generatedSchedule: DailySchedule | null;
  loading: boolean;
  error: string | null;
  generate: (tasks: Task[], initialSessionCount?: number) => void;
  accept: () => Promise<{ error: string | null }>;
  dismiss: () => void;
  regenerateIfNeeded: (tasks: Task[], initialSessionCount?: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSchedule(
  userId: string | null,
  preferences: UserPreferences | null
): UseScheduleResult {
  const [todaySchedule, setTodaySchedule] = useState<DailySchedule | null>(null);
  const [generatedSchedule, setGeneratedSchedule] = useState<DailySchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchSchedule = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error: fetchError } = await getSchedule(userId, today);
    if (fetchError) setError(fetchError.message);
    setTodaySchedule(data);
    if (data) setGeneratedSchedule(data);
    setLoading(false);
  }, [userId, today]);

  const generate = useCallback(
    (tasks: Task[], initialSessionCount = 0) => {
      if (!preferences) return;
      const pendingTasks = tasks.filter(
        (t) =>
          (t.status === 'pending' || t.status === 'scheduled' || t.status === 'in_progress') &&
          t.estimated_pomodoros - t.completed_pomodoros > 0
      );
      const { schedule, error: genError } = generateSchedule(
        pendingTasks,
        preferences,
        today,
        initialSessionCount
      );
      if (genError) {
        setError(genError.message);
      } else if (schedule) {
        setGeneratedSchedule(schedule);
      }
    },
    [preferences, today]
  );

  const accept = useCallback(async (): Promise<{ error: string | null }> => {
    if (!userId || !generatedSchedule) return { error: 'Nothing to accept' };
    const { error: upsertError } = await upsertSchedule(
      userId,
      generatedSchedule.date,
      generatedSchedule.schedule,
      generatedSchedule.algorithm_version,
      true
    );
    if (!upsertError) {
      const accepted = { ...generatedSchedule, accepted: true };
      setTodaySchedule(accepted);
      setGeneratedSchedule(accepted);
    }
    return { error: upsertError?.message || null };
  }, [userId, generatedSchedule]);

  const dismiss = useCallback(() => {
    setGeneratedSchedule(todaySchedule);
  }, [todaySchedule]);

  const regenerateIfNeeded = useCallback(
    async (tasks: Task[], initialSessionCount = 0) => {
      if (!userId || !preferences || !todaySchedule?.accepted) return;
      const pendingTasks = tasks.filter(
        (t) =>
          (t.status === 'pending' || t.status === 'scheduled' || t.status === 'in_progress') &&
          t.estimated_pomodoros - t.completed_pomodoros > 0
      );

      const { schedule, error: genError } = generateSchedule(
        pendingTasks,
        preferences,
        today,
        initialSessionCount
      );
      if (genError || !schedule) return;

      const { error: upsertError } = await upsertSchedule(
        userId,
        today,
        schedule.schedule,
        schedule.algorithm_version,
        true
      );
      if (!upsertError) {
        const updated = { ...todaySchedule, schedule: schedule.schedule };
        setTodaySchedule(updated);
        setGeneratedSchedule(updated);
      }
    },
    [userId, preferences, todaySchedule, today]
  );

  return {
    todaySchedule,
    generatedSchedule,
    loading,
    error,
    generate,
    accept,
    dismiss,
    regenerateIfNeeded,
    refetch: fetchSchedule,
  };
}
