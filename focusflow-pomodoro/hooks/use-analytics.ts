import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getAllSessions, getSessionsWithCategory } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type Period = 'daily' | 'weekly' | 'monthly';

interface DayData {
  date: string;
  minutes: number;
  sessions: number;
  tasksCompleted: number;
}

interface CategoryStats {
  name: string;
  color: string;
  minutes: number;
  sessions: number;
}

export interface AnalyticsData {
  totalSessions: number;
  totalFocusMinutes: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  todaySessions: number;
  todayMinutes: number;
  avgDailyMinutes: number;
  periodData: DayData[];
  categoryStats: CategoryStats[];
  tasksCompleted: number;
  totalTasks: number;
}

function getPeriodDays(p: Period): number {
  return p === 'daily' ? 1 : p === 'weekly' ? 7 : 30;
}

function calculateStreak(sessions: any[]): { current: number; longest: number } {
  const daysWithSessions = new Set(
    sessions?.map((s) => s.start_time.split('T')[0]) || []
  );
  if (daysWithSessions.size === 0) return { current: 0, longest: 0 };

  const sortedDays = Array.from(daysWithSessions).sort();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let currentStreak = 0;
  if (daysWithSessions.has(today)) {
    currentStreak = 1;
    let checkDate = new Date(Date.now() - 86400000);
    while (daysWithSessions.has(checkDate.toISOString().split('T')[0])) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    }
  } else if (daysWithSessions.has(yesterday)) {
    currentStreak = 1;
    let checkDate = new Date(Date.now() - 2 * 86400000);
    while (daysWithSessions.has(checkDate.toISOString().split('T')[0])) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    }
  }

  let longestStreak = 0;
  let tempStreak = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      tempStreak = diff === 1 ? tempStreak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return { current: currentStreak, longest: longestStreak };
}

interface UseAnalyticsResult {
  analytics: AnalyticsData | null;
  period: Period;
  setPeriod: (p: Period) => void;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAnalytics(userId: string | null): UseAnalyticsResult {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<Period>('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    const days = getPeriodDays(period);
    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    const allTimeStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();

    const [allResult, periodResult, { data: tasksData }] = await Promise.all([
      getAllSessions(userId, allTimeStart),
      getSessionsWithCategory(userId, periodStart),
      supabase.from('tasks').select('*').eq('user_id', userId),
    ]);

    if (allResult.error) {
      setError(allResult.error.message);
      setLoading(false);
      return;
    }

    const allSessions = allResult.data || [];
    const periodSessions = periodResult.data || [];

    const today = now.toISOString().split('T')[0];
    const todaySessions = allSessions.filter((s) => s.start_time.startsWith(today));
    const totalFocusMinutes = allSessions.reduce(
      (sum, s) => sum + (s.actual_duration || s.planned_duration), 0
    );
    const todayMinutes = todaySessions.reduce(
      (sum, s) => sum + (s.actual_duration || s.planned_duration), 0
    );
    const streaks = calculateStreak(allSessions);

    const periodData: DayData[] = Array.from({ length: days }, (_, i) => {
      const d = new Date(now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().split('T')[0];
      const daySessions = periodSessions.filter((s) => s.start_time.startsWith(dayStr));
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutes: daySessions.reduce((sum, s) => sum + (s.actual_duration || s.planned_duration), 0),
        sessions: daySessions.length,
        tasksCompleted: new Set(daySessions.map((s) => s.task_id)).size,
      };
    });

    const categoryMap = new Map<string, CategoryStats>();
    periodSessions.forEach((session: any) => {
      if (session.task?.category) {
        const cat = session.task.category;
        const existing = categoryMap.get(cat.name);
        const mins = session.actual_duration || session.planned_duration;
        if (existing) {
          existing.minutes += mins;
          existing.sessions += 1;
        } else {
          categoryMap.set(cat.name, { name: cat.name, color: cat.color, minutes: mins, sessions: 1 });
        }
      }
    });

    const completedTasks = (tasksData || []).filter((t) => t.status === 'completed').length;

    setAnalytics({
      totalSessions: allSessions.length,
      totalFocusMinutes,
      completionRate: allSessions.length
        ? Math.round((allSessions.filter((s) => s.status === 'completed').length / allSessions.length) * 100)
        : 0,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      todaySessions: todaySessions.length,
      todayMinutes,
      avgDailyMinutes: periodData.length > 0
        ? Math.round(periodData.reduce((sum, d) => sum + d.minutes, 0) / periodData.length)
        : 0,
      periodData,
      categoryStats: Array.from(categoryMap.values()).sort((a, b) => b.minutes - a.minutes),
      tasksCompleted: completedTasks,
      totalTasks: tasksData?.length || 0,
    });
    setLoading(false);
  }, [userId, period]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  return { analytics, period, setPeriod, loading, error, refetch: fetchAll };
}
