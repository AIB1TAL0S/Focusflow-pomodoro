import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ScrollView,
  Text,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Task, PomodoroSession } from '@/types/database';
import { ThemedText } from '@/components/ThemedText';
import { GlassCard } from '@/components/GlassCard';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, Shadows } from '@/constants/theme';
import { usePomodoroTimer } from '@/hooks/use-pomodoroTimer';

export default function TimerScreen() {
  const { user, preferences } = useAuth();
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    gradient: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: Spacing.xxl,
    },
    header: {
      alignItems: 'center',
      paddingTop: 60,
      paddingBottom: Spacing.md,
    },
    headerTitle: {
      color: colors.onSurface,
    },
    timerContainer: {
      alignItems: 'center',
      marginVertical: Spacing.lg,
    },
    ringOuter: {
      width: 280,
      height: 280,
      justifyContent: 'center',
      alignItems: 'center',
    },
    ringGlow: {
      position: 'absolute',
      width: 300,
      height: 300,
      borderRadius: 150,
      opacity: 0.15,
    },
    ringTrack: {
      position: 'absolute',
      width: 280,
      height: 280,
      borderRadius: 140,
      borderWidth: 12,
      borderColor: colors.surfaceContainerHigh,
    },
    ringProgress: {
      position: 'absolute',
      width: 280,
      height: 280,
      borderRadius: 140,
      borderWidth: 12,
      borderTopColor: Colors.primary,
      borderRightColor: colors.gradientEnd,
      borderBottomColor: 'transparent',
      borderLeftColor: 'transparent',
    },
    timerInner: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: colors.surface,
    },
    timerText: {
      color: colors.onSurface,
      letterSpacing: -2,
    },
    timerLabel: {
      marginTop: Spacing.xs,
      maxWidth: 180,
      textAlign: 'center',
    },
    taskSelector: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    sectionLabel: {
      marginBottom: Spacing.md,
    },
    noTasksCard: {
      padding: Spacing.lg,
      alignItems: 'center',
    },
    taskOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceContainerLow,
      paddingHorizontal: Spacing.md,
      paddingVertical: 14,
      borderRadius: 12,
      marginBottom: Spacing.sm,
      boxShadow: Shadows.card,
    },
    taskOptionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: Spacing.sm,
    },
    taskOptionRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    taskDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    selectedTaskContainer: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    selectedTaskCard: {
      padding: Spacing.lg,
    },
    taskProgress: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    taskProgressBar: {
      flex: 1,
      height: 4,
      backgroundColor: colors.surfaceContainerHigh,
      borderRadius: 2,
      overflow: 'hidden',
    },
    taskProgressFill: {
      height: '100%',
      backgroundColor: Colors.primary,
      borderRadius: 2,
    },
    breakInfo: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    breakCard: {
      padding: Spacing.lg,
      alignItems: 'center',
    },
    breakIcon: {
      width: 56,
      height: 56,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    skipBreakButton: {
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: 12,
      backgroundColor: colors.surfaceContainerLow,
    },
    controls: {
      alignItems: 'center',
      marginVertical: Spacing.lg,
    },
    startButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      overflow: 'hidden',
      boxShadow: Shadows.glow,
    },
    startButtonGradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    controlRow: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    controlButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surfaceContainerLow,
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: Shadows.elevated,
    },
    stopButton: {
      backgroundColor: `${Colors.error}15`,
    },
    historySection: {
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.md,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    periodFilter: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    periodButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: 9999,
      backgroundColor: colors.surfaceContainerLow,
    },
    periodButtonActive: {
      backgroundColor: `${Colors.primary}20`,
    },
    historyList: {
      gap: Spacing.sm,
    },
    emptyStateContainer: {
      padding: Spacing.lg,
      alignItems: 'center',
    },
    sessionCard: {
      padding: Spacing.md,
    },
    sessionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sessionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    sessionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    sessionBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: 9999,
    },
  }), [colors]);

  type Period = 'daily' | 'weekly' | 'monthly';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyPeriod, setHistoryPeriod] = useState<Period>('daily');
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [todaySessionCount, setTodaySessionCount] = useState(0);

  const isWeeklyComplete = useCallback(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.getFullYear(), now.getMonth(), diff);
    const daysSinceMonday = Math.floor((now.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceMonday >= 6;
  }, []);

  const isMonthlyComplete = useCallback(() => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return now.getDate() >= lastDayOfMonth;
  }, []);

  const shouldShowData = useCallback((period: Period) => {
    switch (period) {
      case 'daily': return true;
      case 'weekly': return isWeeklyComplete();
      case 'monthly': return isMonthlyComplete();
    }
  }, [isWeeklyComplete, isMonthlyComplete]);

  const focusDuration = (preferences?.focus_duration || 25) * 60;
  const shortBreak = (preferences?.short_break_duration || 5) * 60;
  const longBreak = (preferences?.long_break_duration || 15) * 60;
  const pomodorosBeforeLong = preferences?.pomodoros_before_long_break || 4;
  const autoStartBreaks = preferences?.auto_start_breaks || false;

  const progress = useRef(new Animated.Value(1)).current;

  const {
    timeLeft,
    isRunning,
    isBreak,
    sessionCount,
    start: startTimer,
    pause: pauseTimer,
    stop: stopTimer,
    skip: skipSession,
    skipBreak,
  } = usePomodoroTimer(
    focusDuration,
    shortBreak,
    longBreak,
    pomodorosBeforeLong,
    autoStartBreaks,
    selectedTask,
    user,
    todaySessionCount,
    () => fetchSessions(historyPeriod)
  );

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      fetchTodaySessionCount();
      fetchSessions(historyPeriod);
    }, [user, historyPeriod])
  );

  useEffect(() => {
    const totalTime = isBreak
      ? (sessionCount % pomodorosBeforeLong === 0 && sessionCount > 0 ? longBreak : shortBreak)
      : focusDuration;
    const currentProgress = timeLeft / totalTime;
    Animated.timing(progress, {
      toValue: currentProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, isBreak]);

  const fetchTasks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: false });
    setTasks(data || []);
  };

  const fetchTodaySessionCount = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('pomodoro_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('start_time', `${today}T00:00:00.000Z`);
    setTodaySessionCount(count || 0);
  };

  const fetchSessions = async (period: Period) => {
    if (!user) return;

    if (!shouldShowData(period)) {
      setSessions([]);
      return;
    }

    const now = new Date();
    let startDate: string;

    switch (period) {
      case 'daily':
        startDate = now.toISOString().split('T')[0];
        break;
      case 'weekly': {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.getFullYear(), now.getMonth(), diff);
        startDate = monday.toISOString().split('T')[0];
        break;
      }
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        break;
    }

    const { data } = await supabase
      .from('pomodoro_sessions')
      .select('*, task:tasks(title)')
      .eq('user_id', user.id)
      .gte('start_time', `${startDate}T00:00:00.000Z`)
      .order('start_time', { ascending: false });
    setSessions(data || []);
  };

  const handleSkipSession = useCallback(() => {
    if (!isRunning || isBreak) return;
    if (!selectedTask) return;

    Alert.alert(
      'Skip Session',
      'Are you sure you want to skip this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => skipSession(),
        },
      ]
    );
  }, [isRunning, isBreak, selectedTask, skipSession]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const rotation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const isLongBreakUpcoming = sessionCount > 0 && sessionCount % pomodorosBeforeLong === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <StatusBar style={colors.isDark ? "light" : "dark"} />
      <LinearGradient
        colors={colors.isDark ? [colors.gradientStart, colors.gradientEnd] : [colors.background, colors.background]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText variant="headlineSmall" style={styles.headerTitle}>
              {isBreak ? (isLongBreakUpcoming ? 'Long Break' : 'Short Break') : 'Focus Time'}
            </ThemedText>
            <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant}>
              {sessionCount} sessions today
            </ThemedText>
          </View>

          {/* Focus Ring Timer */}
          <View style={styles.timerContainer}>
            <View style={styles.ringOuter}>
              {/* Gradient glow behind the ring */}
              <LinearGradient
                colors={[
                  isBreak ? Colors.secondary : Colors.primary,
                  isBreak ? colors.gradientAccent : colors.gradientEnd,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ringGlow}
              />

              {/* Background track */}
              <View style={styles.ringTrack} />

              {/* Progress ring - rotated based on remaining time */}
              <Animated.View
                style={[
                  styles.ringProgress,
                  { transform: [{ rotate: rotation }] },
                ]}
              />

              {/* Center content */}
              <View style={styles.timerInner}>
                <ThemedText variant="displayLarge" style={styles.timerText}>
                  {formatTime(timeLeft)}
                </ThemedText>
                <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant} style={styles.timerLabel}>
                  {isBreak
                    ? (isLongBreakUpcoming ? 'Recharge fully' : 'Take a breath')
                    : (selectedTask?.title || 'Select a task')
                  }
                </ThemedText>
                {!isBreak && selectedTask && (
                  <ThemedText variant="labelMedium" color={Colors.primaryFixedDim}>
                    {selectedTask.completed_pomodoros}/{selectedTask.estimated_pomodoros} pomodoros
                  </ThemedText>
                )}
              </View>
            </View>
          </View>

          {/* Task Selection (only when not on break) */}
          {!isBreak && !selectedTask && (
            <View style={styles.taskSelector}>
              <ThemedText variant="titleMedium" color={colors.onSurface} style={styles.sectionLabel}>
                Select a task to focus on
              </ThemedText>
              {tasks.length === 0 && (
                <GlassCard style={styles.noTasksCard} gradient>
                  <Text style={{ fontSize: 32 }}>✅</Text>
                  <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant} style={{ textAlign: 'center', marginTop: Spacing.sm }}>
                    No pending tasks. Create one from the Dashboard.
                  </ThemedText>
                </GlassCard>
              )}
              {tasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskOption}
                  onPress={() => setSelectedTask(task)}
                >
                  <View style={styles.taskOptionLeft}>
                    <View style={[styles.taskDot, { backgroundColor: task.priority >= 4 ? Colors.error : Colors.primary }]} />
                    <ThemedText variant="bodyLarge" color={colors.onSurface} numberOfLines={1} style={{ flex: 1 }}>
                      {task.title}
                    </ThemedText>
                  </View>
                  <View style={styles.taskOptionRight}>
                    <ThemedText variant="labelMedium" color={colors.onSurfaceVariant}>
                      {task.completed_pomodoros}/{task.estimated_pomodoros}
                    </ThemedText>
                    <Text style={{ fontSize: 14 }}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Selected Task Display */}
          {selectedTask && !isBreak && (
            <View style={styles.selectedTaskContainer}>
              <GlassCard style={styles.selectedTaskCard} gradient glow glowColor={Colors.primary}>
                <ThemedText variant="labelMedium" color={colors.onSurfaceVariant}>Focusing on</ThemedText>
                <ThemedText variant="titleMedium" color={colors.onSurface} style={{ marginTop: Spacing.xs }}>
                  {selectedTask.title}
                </ThemedText>
                <View style={styles.taskProgress}>
                  <View style={styles.taskProgressBar}>
                    <View
                      style={[
                        styles.taskProgressFill,
                        {
                          width: `${Math.min((selectedTask.completed_pomodoros / selectedTask.estimated_pomodoros) * 100, 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>
                    {selectedTask.completed_pomodoros}/{selectedTask.estimated_pomodoros}
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={() => { setSelectedTask(null); stopTimer(); }}>
                  <ThemedText variant="bodyMedium" color={Colors.primary} style={{ marginTop: Spacing.sm }}>
                    Change Task
                  </ThemedText>
                </TouchableOpacity>
              </GlassCard>
            </View>
          )}

          {/* Break Info */}
          {isBreak && (
            <View style={styles.breakInfo}>
              <GlassCard style={styles.breakCard} gradient glow glowColor={Colors.secondary}>
                <View style={[styles.breakIcon, { backgroundColor: `${Colors.secondary}25` }]}>
                  <Text style={{ fontSize: 28 }}>☕</Text>
                </View>
                <ThemedText
                  variant="bodyLarge"
                  color={colors.onSurfaceVariant}
                  style={{ textAlign: 'center', marginTop: Spacing.sm }}
                >
                  {isLongBreakUpcoming
                    ? `You've completed ${pomodorosBeforeLong} sessions! Time for a longer break.`
                    : 'Step away from the screen. Stretch, hydrate, rest your eyes.'}
                </ThemedText>
                <TouchableOpacity onPress={async () => await skipBreak()} style={styles.skipBreakButton}>
                  <ThemedText variant="labelLarge" color={colors.onSurface}>Skip Break</ThemedText>
                </TouchableOpacity>
              </GlassCard>
            </View>
          )}

          {/* Controls */}
          <View style={styles.controls}>
            {!isRunning ? (
              <TouchableOpacity style={styles.startButton} onPress={startTimer}>
                <LinearGradient
                  colors={[Colors.primary, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.startButtonGradient}
                >
                  <Text style={{ fontSize: 32 }}>▶️</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.controlRow}>
                <TouchableOpacity style={styles.controlButton} onPress={pauseTimer}>
                  <Text style={{ fontSize: 28 }}>⏸️</Text>
                </TouchableOpacity>
{!isBreak && (
                  <TouchableOpacity style={[styles.controlButton, { backgroundColor: `${Colors.warning}20` }]} onPress={handleSkipSession}>
                    <Text style={{ fontSize: 20 }}>⏭️</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={stopTimer}>
                  <Text style={{ fontSize: 28 }}>⏹️</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Sessions History */}
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <ThemedText variant="titleMedium" color={colors.onSurface}>
                Sessions ({sessions.length})
              </ThemedText>
              <TouchableOpacity onPress={() => setShowHistory(!showHistory)}>
                <Text style={{ fontSize: 16 }}>{showHistory ? '🔼' : '🔽'}</Text>
              </TouchableOpacity>
            </View>

          {showHistory && (
            <View>
              <View style={styles.periodFilter}>
                {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.periodButton,
                      historyPeriod === p && styles.periodButtonActive,
                    ]}
                    onPress={() => setHistoryPeriod(p)}
                  >
                    <ThemedText
                      variant="labelMedium"
                      color={historyPeriod === p ? colors.onSurface : colors.onSurfaceVariant}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
              {!shouldShowData(historyPeriod) ? (
                <View style={styles.emptyStateContainer}>
                  <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant} style={{ textAlign: 'center' }}>
                    {historyPeriod === 'weekly'
                      ? 'Weekly insights will be available after 7 days'
                      : 'Monthly insights will be available at month end'}
                  </ThemedText>
                </View>
              ) : sessions.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant} style={{ textAlign: 'center', padding: Spacing.lg }}>
                    No sessions for this period
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.historyList}>
                  {sessions.map((session) => (
                    <GlassCard key={session.id} style={styles.sessionCard} gradient>
                      <View style={styles.sessionRow}>
                        <View style={styles.sessionLeft}>
                          <View style={[
                            styles.sessionDot,
                            { backgroundColor: session.status === 'completed' ? Colors.success : Colors.error }
                          ]} />
                          <View>
                            <ThemedText variant="bodyMedium" color={colors.onSurface}>
                              {session.task?.title || 'Unknown Task'}
                            </ThemedText>
                            <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>
                              {new Date(session.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              {' · '}
                              {session.actual_duration || session.planned_duration} min
                            </ThemedText>
                          </View>
                        </View>
                        <View style={[
                          styles.sessionBadge,
                          { backgroundColor: session.status === 'completed' ? `${Colors.success}20` : `${Colors.error}20` }
                        ]}>
                          <ThemedText variant="labelSmall" color={session.status === 'completed' ? Colors.success : Colors.error}>
                            {session.status}
                          </ThemedText>
                        </View>
                      </View>
                    </GlassCard>
                  ))}
                </View>
              )}
            </View>
          )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}