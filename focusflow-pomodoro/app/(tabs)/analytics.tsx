import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Text,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/use-analytics';
import { ThemedText } from '@/components/ThemedText';
import { GlassCard } from '@/components/GlassCard';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing } from '@/constants/theme';
import { AnalyticsSkeleton } from '@/components/skeletons/AnalyticsSkeleton';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const colors = useThemeColors();
  const { analytics, period, setPeriod, loading, refetch } = useAnalytics(user?.id ?? null);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const maxMinutes = Math.max(...(analytics?.periodData.map((d) => d.minutes) || [1]), 1);
  const totalPeriodMinutes = analytics?.periodData.reduce((sum, d) => sum + d.minutes, 0) || 1;

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    gradient: { flex: 1 },
    header: { paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: Spacing.md },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
    periodToggle: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 12,
      padding: 4,
      marginBottom: Spacing.lg,
    },
    periodButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    periodButtonActive: { backgroundColor: Colors.primary },
    statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
    statCard: { alignItems: 'center', paddingVertical: Spacing.md },
    statIcon: {
      width: 40, height: 40, borderRadius: 12,
      justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm,
    },
    streakCard: { padding: Spacing.lg, marginBottom: Spacing.lg },
    streakRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    streakItem: { alignItems: 'center', gap: Spacing.xs },
    streakIcon: {
      width: 48, height: 48, borderRadius: 16,
      justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs,
    },
    streakDivider: { width: 1, height: 50, backgroundColor: colors.outlineVariant },
    section: { marginBottom: Spacing.lg },
    sectionTitle: { marginBottom: Spacing.md },
    chartContainer: {
      flexDirection: 'row', alignItems: 'flex-end',
      height: 180, paddingTop: Spacing.md, paddingHorizontal: Spacing.sm,
    },
    barWrapper: { alignItems: 'center', width: 48, marginHorizontal: 4 },
    barContainer: { height: 150, justifyContent: 'flex-end' },
    bar: { width: 24, backgroundColor: colors.surfaceContainerHigh, borderRadius: 4 },
    categoryCard: { padding: Spacing.md },
    categoryRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingVertical: Spacing.sm,
    },
    categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, width: 100 },
    categoryDot: { width: 10, height: 10, borderRadius: 5 },
    categoryRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    categoryBarTrack: {
      flex: 1, height: 6,
      backgroundColor: colors.surfaceContainerHigh, borderRadius: 3, overflow: 'hidden',
    },
    categoryBarFill: { height: '100%', borderRadius: 3 },
    categoryPercent: { width: 36, textAlign: 'right' },
    taskCompletion: { padding: Spacing.md },
    taskCompletionHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: Spacing.md,
    },
    completionIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    taskProgressTrack: { height: 8, backgroundColor: colors.surfaceContainerHigh, borderRadius: 4, overflow: 'hidden' },
    taskProgressFill: { height: '100%', borderRadius: 4 },
    summaryCard: { padding: Spacing.md },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
    summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    summaryIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    summaryDivider: { height: 1, backgroundColor: colors.outlineVariant, marginVertical: Spacing.xs },
  }), [colors]);

  if (loading && !refreshing) return <AnalyticsSkeleton />;

  return (
    <View style={styles.container}>
      <StatusBar style={colors.isDark ? 'light' : 'dark'} />
      <LinearGradient
        colors={colors.isDark ? [colors.gradientStart, colors.gradientEnd] : [colors.background, colors.background]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <ThemedText variant="headlineSmall" color={colors.onSurface}>Analytics</ThemedText>
          <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant}>Track your focus journey</ThemedText>
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
                {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.periodButton, period === p && styles.periodButtonActive]}
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
                  <View style={[styles.statIcon, { backgroundColor: `${Colors.primary}25` }]}><Text style={{ fontSize: 20 }}>✅</Text></View>
                  <ThemedText variant="displaySmall" color={colors.onSurface}>{analytics.todaySessions}</ThemedText>
                  <ThemedText variant="bodySmall" color={colors.onSurfaceVariant}>Today</ThemedText>
                </GlassCard>
                <GlassCard style={[styles.statCard, { flex: 1 }]} gradient glow glowColor={Colors.secondary}>
                  <View style={[styles.statIcon, { backgroundColor: `${Colors.secondary}25` }]}><Text style={{ fontSize: 20 }}>⏱️</Text></View>
                  <ThemedText variant="displaySmall" color={colors.onSurface}>{analytics.todayMinutes}</ThemedText>
                  <ThemedText variant="bodySmall" color={colors.onSurfaceVariant}>Minutes</ThemedText>
                </GlassCard>
                <GlassCard style={[styles.statCard, { flex: 1 }]} gradient glow glowColor={Colors.tertiary}>
                  <View style={[styles.statIcon, { backgroundColor: `${Colors.tertiary}25` }]}><Text style={{ fontSize: 20 }}>🔥</Text></View>
                  <ThemedText variant="displaySmall" color={colors.onSurface}>{analytics.currentStreak}</ThemedText>
                  <ThemedText variant="bodySmall" color={colors.onSurfaceVariant}>Streak</ThemedText>
                </GlassCard>
              </View>

              {/* Streak Card */}
              <GlassCard style={styles.streakCard} gradient>
                <View style={styles.streakRow}>
                  <View style={styles.streakItem}>
                    <View style={[styles.streakIcon, { backgroundColor: `${Colors.error}25` }]}><Text style={{ fontSize: 24 }}>🔥</Text></View>
                    <ThemedText variant="headlineSmall" color={colors.onSurface}>{analytics.currentStreak}</ThemedText>
                    <ThemedText variant="bodySmall" color={colors.onSurfaceVariant}>Current Streak</ThemedText>
                  </View>
                  <View style={styles.streakDivider} />
                  <View style={styles.streakItem}>
                    <View style={[styles.streakIcon, { backgroundColor: `${Colors.warning}25` }]}><Text style={{ fontSize: 24 }}>🏆</Text></View>
                    <ThemedText variant="headlineSmall" color={colors.onSurface}>{analytics.longestStreak}</ThemedText>
                    <ThemedText variant="bodySmall" color={colors.onSurfaceVariant}>Best Streak</ThemedText>
                  </View>
                </View>
              </GlassCard>

              {/* Focus Time Chart */}
              <View style={styles.section}>
                <ThemedText variant="titleMedium" color={colors.onSurface} style={styles.sectionTitle}>Focus Time</ThemedText>
                <GlassCard gradient>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={[styles.chartContainer, { minWidth: analytics.periodData.length * 56 }]}>
                      {analytics.periodData.map((day, index) => {
                        const height = (day.minutes / maxMinutes) * 150;
                        const isToday = index === analytics.periodData.length - 1;
                        return (
                          <View key={index} style={styles.barWrapper}>
                            <View style={styles.barContainer}>
                              {isToday ? (
                                <LinearGradient
                                  colors={[Colors.primary, colors.gradientEnd]}
                                  start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }}
                                  style={[styles.bar, { height: Math.max(height, 4) }]}
                                />
                              ) : (
                                <View style={[styles.bar, { height: Math.max(height, 4) }]} />
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
                  <ThemedText variant="titleMedium" color={colors.onSurface} style={styles.sectionTitle}>By Category</ThemedText>
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
                              <View style={[styles.categoryBarFill, { width: `${percentage}%`, backgroundColor: cat.color }]} />
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
                <ThemedText variant="titleMedium" color={colors.onSurface} style={styles.sectionTitle}>Task Completion</ThemedText>
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
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={[styles.taskProgressFill, {
                          width: `${analytics.totalTasks > 0
                            ? (analytics.tasksCompleted / analytics.totalTasks) * 100
                            : 0}%`
                        }]}
                      />
                    </View>
                  </View>
                </GlassCard>
              </View>

              {/* All Time */}
              <View style={styles.section}>
                <ThemedText variant="titleMedium" color={colors.onSurface} style={styles.sectionTitle}>All Time</ThemedText>
                <GlassCard gradient>
                  <View style={styles.summaryCard}>
                    {[
                      { icon: '🕐', label: 'Total Focus Time', value: `${Math.floor(analytics.totalFocusMinutes / 60)}h ${analytics.totalFocusMinutes % 60}m`, color: Colors.primary },
                      { icon: '🔢', label: 'Total Sessions', value: String(analytics.totalSessions), color: Colors.secondary },
                      { icon: '📊', label: 'Avg Daily Focus', value: `${analytics.avgDailyMinutes}m`, color: Colors.warning },
                      { icon: '✅', label: 'Completion Rate', value: `${analytics.completionRate}%`, color: Colors.success },
                    ].map((row, i, arr) => (
                      <React.Fragment key={row.label}>
                        <View style={styles.summaryRow}>
                          <View style={styles.summaryLeft}>
                            <View style={[styles.summaryIcon, { backgroundColor: `${row.color}25` }]}>
                              <Text style={{ fontSize: 18 }}>{row.icon}</Text>
                            </View>
                            <ThemedText variant="bodyLarge" color={colors.onSurfaceVariant}>{row.label}</ThemedText>
                          </View>
                          <ThemedText variant="titleMedium" color={colors.onSurface}>{row.value}</ThemedText>
                        </View>
                        {i < arr.length - 1 && <View style={styles.summaryDivider} />}
                      </React.Fragment>
                    ))}
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
