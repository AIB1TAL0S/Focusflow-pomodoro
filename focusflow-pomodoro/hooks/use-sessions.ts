import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { PomodoroSession } from '@/types/database';
import { deleteSessions, getSessions, getTodayCount } from '@/lib/api';

type Period = 'daily' | 'weekly' | 'monthly';

function getStartDate(period: Period): string {
  const now = new Date();
  switch (period) {
    case 'daily':
      return now.toISOString().split('T')[0];
    case 'weekly': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.getFullYear(), now.getMonth(), diff);
      return monday.toISOString().split('T')[0];
    }
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  }
}

interface UseSessionsResult {
  sessions: PomodoroSession[];
  todayCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearSessions: (status?: PomodoroSession['status']) => Promise<{ error: Error | null }>;
}

export function useSessions(
  userId: string | null,
  period: Period
): UseSessionsResult {
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    const startDate = getStartDate(period);
    const [sessionsResult, countResult] = await Promise.all([
      getSessions(userId, startDate),
      getTodayCount(userId),
    ]);

    if (sessionsResult.error) setError(sessionsResult.error.message);
    setSessions(sessionsResult.data || []);
    setTodayCount(countResult.count);
    setLoading(false);
  }, [userId, period]);

  const clearSessions = useCallback(
    async (status?: PomodoroSession['status']) => {
      if (!userId) {
        return { error: new Error('Not authenticated') };
      }

      const startDate = getStartDate(period);
      const result = await deleteSessions(userId, startDate, status);

      if (!result.error) {
        await fetchAll();
      }

      return result;
    },
    [userId, period, fetchAll]
  );

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  return { sessions, todayCount, loading, error, refetch: fetchAll, clearSessions };
}
