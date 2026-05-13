import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/ThemedText';
import { GlassCard } from '@/components/GlassCard';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing } from '@/constants/theme';

import { AnalyticsSkeleton } from '@/components/skeletons/AnalyticsSkeleton';

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

interface AnalyticsData {
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

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    color: colors.onSurface,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  streakCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  streakItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  streakDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.outlineVariant,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  barWrapper: {
    alignItems: 'center',
    width: 48,
    marginHorizontal: 4,
  },
  barContainer: {
    height: 150,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 24,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 4,
  },
  barToday: {
    borderRadius: 4,
  },
  categoryCard: {
    padding: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: 100,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  categoryBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercent: {
    width: 36,
    textAlign: 'right',
  },
  taskCompletion: {
    padding: Spacing.md,
  },
  taskCompletionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  completionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskProgressTrack: {
    height: 8,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 4,
    overflow: 'hidden',
  },
  taskProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryCard: {
    padding: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginVertical: Spacing.xs,
  },
}), [colors]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<Period>('weekly');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const getPeriodDays = (p: Period): number => {
    switch (p) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
    }
  };

  const calculateStreak = (sessions: any[]): { current: number; longest: number } => {
    const daysWithSessions = new Set(
      sessions?.map((s) => s.start_time.split('T')[0]) || []
    );
    
    if (daysWithSessions.size === 0) return { current: 0, longest: 0 };
    
    const sortedDays = Array.from(daysWithSessions).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Check current streak
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
    
    // Calculate longest streak
    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedDays[i - 1]);
        const curr = new Date(sortedDays[i]);
        const diff = (curr.getTime() - prev.getTime()) / 86400000;
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }
    
    return { current: currentStreak, longest: longestStreak };
  };

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);

    const days = getPeriodDays(period);
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    const allTimeStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: allSessions },
      { data: periodSessions },
      { data: tasksData },
    ] = await Promise.all([
      supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', allTimeStart),
      supabase
        .from('pomodoro_sessions')
        .select('*, task:tasks(title, category:categories(name, color))')
        .eq('user_id', user.id)
        .gte('start_time', startDate),
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id),
    ]);

    const today = now.toISOString().split('T')[0];
    const todaySessions = allSessions?.filter((s) => s.start_time.startsWith(today)) || [];
    
    const totalFocusMinutes = allSessions?.reduce(
      (sum, s) => sum + (s.actual_duration || s.planned_duration), 0
    ) || 0;

    const todayMinutes = todaySessions.reduce(
      (sum, s) => sum + (s.actual_duration || s.planned_duration), 0
    ) || 0;

    const streaks = calculateStreak(allSessions || []);

    // Period data
    const periodData: DayData[] = Array.from({ length: days }, (_, i) => {
      const d = new Date(now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().split('T')[0];
      const daySessions = periodSessions?.filter((s) => s.start_time.startsWith(dayStr)) || [];
      const dayMinutes = daySessions.reduce(
        (sum, s) => sum + (s.actual_duration || s.planned_duration), 0
      );
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutes: dayMinutes,
        sessions: daySessions.length,
        tasksCompleted: new Set(daySessions.map(s => s.task_id)).size,
      };
    });

    // Category stats
    const categoryMap = new Map<string, CategoryStats>();
    periodSessions?.forEach((session) => {
      if (session.task?.category) {
        const cat = session.task.category;
        const existing = categoryMap.get(cat.name);
        if (existing) {
          existing.minutes += (session.actual_duration || session.planned_duration);
          existing.sessions += 1;
        } else {
          categoryMap.set(cat.name, {
            name: cat.name,
            color: cat.color,
            minutes: (session.actual_duration || session.planned_duration),
            sessions: 1,
          });
        }
      }
    });
    const categoryStats = Array.from(categoryMap.values()).sort((a, b) => b.minutes - a.minutes);

    const completedTasks = (tasksData || []).filter(t => t.status === 'completed').length;

    setAnalytics({
      totalSessions: allSessions?.length || 0,
      totalFocusMinutes,
      completionRate: allSessions?.length
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
      categoryStats,
      tasksCompleted: completedTasks,
      totalTasks: tasksData?.length || 0,
    });
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [user, period])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const maxMinutes = Math.max(...(analytics?.periodData.map((d) => d.minutes) || [1]), 1);
  const totalPeriodMinutes = analytics?.periodData.reduce((sum, d) => sum + d.minutes, 0) || 1;

  if (loading && !refreshing) {
    return <AnalyticsSkeleton />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <StatusBar style={colors.isDark ? "light" : "dark"} />
      <LinearGradient
        colors={colors.isDark ? [colors.gradientStart, colors.gradientEnd] : [colors.background, colors.background]}
        style={styles.gradient}
      >{/* Header */}
        <View style={styles.header}>
          <ThemedText variant="headlineSmall" style={styles.headerTitle}>Analytics</ThemedText>
          <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant}>
            Track your focus journey
          </ThemedText>
        </View>

        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {analytics && (
            <>
              {/* Period Toggle */}
              <View style={styles.periodToggle}>
                {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.periodButton,
                      period === p && styles.periodButtonActive,
                    ]}
                    onPress={() => setPeriod(p)}
                  >
                    <ThemedText
                      variant="labelLarge"
                      color={period === p ? colors.onPrimary : colors.onSurfaceVariant}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quick Stats */}
              <View style={styles.statsRow}>
                <GlassCard style={[styles.statCard, { flex: 1 }]} gradient glow glowColor={Colors.primary}>
                  <View style={[styles.statIcon, { backgroundColor: `${Colors.primary}25` }]}>
                    <Text style={{ fontSize: 20 }}>✅</Text>
                  </View>
                  <ThemedText variant="displaySmall" color={colors.onSurface}>{analytics.todaySessions}</ThemedText>
                  <ThemedText variant="bodySmall" color={colors.onSurfaceVariant}>Today</ThemedText>
                </GlassCard>
                <GlassCard style={[styles.statCard, { flex: 1 }]} gradient glow glowColor={Colors.secondary}>
                  <View style={[styles.statIcon, { backgroundColor: `${Colors.secondary}25` }]}>
                    <Text style={{ fontSize: 20 }}>⏱️</Text>
                  </View>
                  <ThemedText variant="displaySmall" color={colors.onSurface}>{analytics.todayMinutes}</ThemedText>
                  <ThemedText variant="bodySmall" color={colors.onSurfaceVariant}>Minutes</ThemedText>
                </GlassCard>
                <GlassCard style={[styles.statCard, { flex: 1 }]} gradient glow glowColor={Colors.tertiary}>
                  <View style={[styles.statIcon, { backgroundColor: `${Colors.tertiary}25` }]}>
                    <Text style={{ fontSize: 20 }}>🔥</Text>
                  </View>
                  <ThemedText variant="displaySmall" color={colors.onSurface}>{analytics.currentStreak}</ThemedText>
                  <ThemedText variant="bodySmall" color={colors.onSurfaceVariant}>Streak</ThemedText>
                </GlassCard>
              </View>

              {/* Streak Card */}
              <GlassCard style={styles.streakCard} gradient>
                <View style={styles.streakRow}>
                  <View style={styles.streakItem}>
                    <View style={[styles.streakIcon, { backgroundColor: `${Colors.error}25` }]}>
                      <Text style={{ fontSize: 24 }}>🔥</Text>
                    </View>
                    <ThemedText variant="headlineSmall" color={colors.onSurface}>{analytics.currentStreak}</ThemedText>
                    <ThemedText variant="bodySmall" color={colors.onSurfaceVariant}>Current Streak</ThemedText>
                  </View>
                  <View style={styles.streakDivider} />
                  <View style={styles.streakItem}>
                    <View style={[styles.streakIcon, { backgroundColor: `${Colors.warning}25` }]}>
                      <Text style={{ fontSize: 24 }}>🏆</Text>
                    </View>
                    <ThemedText variant="headlineSmall" color={colors.onSurface}>{analytics.longestStreak}</ThemedText>
                    <ThemedText variant="bodySmall" color={colors.onSurfaceVariant}>Best Streak</ThemedText>
                  </View>
                </View>
              </GlassCard>

              {/* Period Chart */}
              <View style={styles.section}>
                <ThemedText variant="titleMedium" color={colors.onSurface} style={styles.sectionTitle}>
                  Focus Time
                </ThemedText>
                <GlassCard gradient>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={[styles.chartContainer, { minWidth: analytics.periodData.length * 56 }]}
                    >
                      {analytics.periodData.map((day, index) => {
                        const height = (day.minutes / maxMinutes) * 150;
                        const isToday = index === analytics.periodData.length - 1;
                        return (
                          <View key={index} style={styles.barWrapper}>
                            <View style={styles.barContainer}>
                              {isToday ? (
                                <LinearGradient
                                  colors={[Colors.primary, colors.gradientEnd]}
                                  start={{ x: 0, y: 1 }}
                                  end={{ x: 0, y: 0 }}
                                  style={[
                                    styles.bar,
                                    { height: Math.max(height, 4) },
                                    styles.barToday,
                                  ]}
                                />
                              ) : (
                                <View style={[
                                  styles.bar, 
                                  { height: Math.max(height, 4) },
                                ]} />
                              )}
                            </View>
                            <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>{day.date}</ThemedText>
                            <ThemedText variant="labelSmall" color={isToday ? Colors.primary : colors.onSurfaceVariant}>
                              {day.minutes}m
                            </ThemedText>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                </GlassCard>
              </View>

              {/* Category Distribution */}
              {analytics.categoryStats.length > 0 && (
                <View style={styles.section}>
                  <ThemedText variant="titleMedium" color={colors.onSurface} style={styles.sectionTitle}>
                    By Category
                  </ThemedText>
                  <GlassCard style={styles.categoryCard} gradient>
                    {analytics.categoryStats.map((cat, index) => {
                      const percentage = Math.round((cat.minutes / totalPeriodMinutes) * 100);
                      return (
                        <View key={index} style={styles.categoryRow}>
                          <View style={styles.categoryLeft}>
                            <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                            <ThemedText variant="bodyMedium" color={colors.onSurface}>{cat.name}</ThemedText>
                          </View>
                          <View style={styles.categoryRight}>
                            <View style={styles.categoryBarTrack}>
                              <View style={[
                                styles.categoryBarFill,
                                { width: `${percentage}%`, backgroundColor: cat.color }
                              ]} />
                            </View>
                            <ThemedText variant="labelSmall" color={colors.onSurfaceVariant} style={styles.categoryPercent}>
                              {percentage}%
                            </ThemedText>
                          </View>
                        </View>
                      );
                    })}
                  </GlassCard>
                </View>
              )}

              {/* Task Completion */}
              <View style={styles.section}>
                <ThemedText variant="titleMedium" color={colors.onSurface} style={styles.sectionTitle}>
                  Task Completion
                </ThemedText>
                <GlassCard gradient>
                  <View style={styles.taskCompletion}>
                    <View style={styles.taskCompletionHeader}>
                      <View>
                        <ThemedText variant="displaySmall" color={colors.onSurface}>
                          {analytics.tasksCompleted}/{analytics.totalTasks}
                        </ThemedText>
                        <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant}>
                          {analytics.totalTasks > 0 
                            ? Math.round((analytics.tasksCompleted / analytics.totalTasks) * 100) 
                            : 0}% completed
                        </ThemedText>
                      </View>
                      <View style={[styles.completionIcon, { backgroundColor: `${Colors.success}25` }]}>
                        <Text style={{ fontSize: 24 }}>🎯</Text>
                      </View>
                    </View>
                    <View style={styles.taskProgressTrack}>
                      <LinearGradient
                        colors={[Colors.primary, colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.taskProgressFill,
                          { 
                            width: `${analytics.totalTasks > 0 
                              ? (analytics.tasksCompleted / analytics.totalTasks) * 100 
                              : 0}%` 
                          }
                        ]}
                      />
                    </View>
                  </View>
                </GlassCard>
              </View>

              {/* Overall Stats */}
              <View style={styles.section}>
                <ThemedText variant="titleMedium" color={colors.onSurface} style={styles.sectionTitle}>
                  All Time
                </ThemedText>
                <GlassCard gradient>
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryLeft}>
                        <View style={[styles.summaryIcon, { backgroundColor: `${Colors.primary}25` }]}>
                          <Text style={{ fontSize: 18 }}>🕐</Text>
                        </View>
                        <ThemedText variant="bodyLarge" color={colors.onSurfaceVariant}>Total Focus Time</ThemedText>
                      </View>
                      <ThemedText variant="titleMedium" color={colors.onSurface}>
                        {Math.floor(analytics.totalFocusMinutes / 60)}h {analytics.totalFocusMinutes % 60}m
                      </ThemedText>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryLeft}>
                        <View style={[styles.summaryIcon, { backgroundColor: `${Colors.secondary}25` }]}>
                          <Text style={{ fontSize: 18 }}>🔢</Text>
                        </View>
                        <ThemedText variant="bodyLarge" color={colors.onSurfaceVariant}>Total Sessions</ThemedText>
                      </View>
                      <ThemedText variant="titleMedium" color={colors.onSurface}>{analytics.totalSessions}</ThemedText>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryLeft}>
                        <View style={[styles.summaryIcon, { backgroundColor: `${Colors.warning}25` }]}>
                          <Text style={{ fontSize: 18 }}>📊</Text>
                        </View>
                        <ThemedText variant="bodyLarge" color={colors.onSurfaceVariant}>Avg Daily Focus</ThemedText>
                      </View>
                      <ThemedText variant="titleMedium" color={colors.onSurface}>{analytics.avgDailyMinutes}m</ThemedText>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryLeft}>
                        <View style={[styles.summaryIcon, { backgroundColor: `${Colors.success}25` }]}>
                          <Text style={{ fontSize: 18 }}>✅</Text>
                        </View>
                        <ThemedText variant="bodyLarge" color={colors.onSurfaceVariant}>Completion Rate</ThemedText>
                      </View>
                      <ThemedText variant="titleMedium" color={colors.onSurface}>{analytics.completionRate}%</ThemedText>
                    </View>
                  </View>
                </GlassCard>
              </View>
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

