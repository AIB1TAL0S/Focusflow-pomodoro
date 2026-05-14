import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { usePomodoroTimer } from '@/hooks/use-pomodoroTimer';
import { useTasks } from '@/hooks/use-tasks';
import { useSessions } from '@/hooks/use-sessions';
import { useSchedule } from '@/hooks/use-schedule';
import { ThemedText } from '@/components/ThemedText';
import { FocusRing } from '@/components/timer/FocusRing';
import { TimerControls } from '@/components/timer/TimerControls';
import { ModeSelector, TimerMode } from '@/components/timer/ModeSelector';
import { PomodoroDotsRow } from '@/components/timer/PomodoroDotsRow';
import { EstimatedFinish } from '@/components/timer/EstimatedFinish';
import { TaskSelector } from '@/components/timer/TaskSelector';
import { SelectedTaskCard } from '@/components/timer/SelectedTaskCard';
import { BreakCard } from '@/components/timer/BreakCard';
import { SessionHistory } from '@/components/timer/SessionHistory';
import { CelebrationOverlay } from '@/components/timer/CelebrationOverlay';
import { TaskCompleteOverlay } from '@/components/timer/TaskCompleteOverlay';
import { Task } from '@/types/database';
import { Spacing } from '@/constants/theme';

type Period = 'daily' | 'weekly' | 'monthly';

export default function TimerScreen() {
  const { user, preferences } = useAuth();
  const colors = useThemeColors();

  const [sessionPeriod, setSessionPeriod] = useState<Period>('daily');
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedTask, setCompletedTask] = useState<Task | null>(null);

  // Data hooks
  const { activeTasks, selectedTask, setSelectedTask, refetch: refetchTasks } = useTasks(user?.id ?? null);
  const {
    sessions,
    todayCount,
    loading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
    clearSessions,
  } = useSessions(user?.id ?? null, sessionPeriod);
  const { regenerateIfNeeded } = useSchedule(user?.id ?? null, preferences ?? null);

  // Timer config from preferences
  const focusDuration = (preferences?.focus_duration || 25) * 60;
  const shortBreak = (preferences?.short_break_duration || 5) * 60;
  const longBreak = (preferences?.long_break_duration || 15) * 60;
  const pomodorosBeforeLong = preferences?.pomodoros_before_long_break || 4;
  const autoStartBreaks = preferences?.auto_start_breaks || false;

  const handleSessionsUpdate = useCallback(async () => {
    await Promise.all([refetchTasks(), refetchSessions()]);
    regenerateIfNeeded(activeTasks);
  }, [refetchTasks, refetchSessions, regenerateIfNeeded, activeTasks]);

  const handleLongBreakComplete = useCallback(() => {
    setShowCelebration(true);
    regenerateIfNeeded(activeTasks);
  }, [regenerateIfNeeded, activeTasks]);

  const handleTaskComplete = useCallback((task: Task) => {
    setCompletedTask(task);
  }, []);

  const {
    timeLeft,
    isRunning,
    isBreak,
    sessionCount,
    currentSessionId,
    start,
    pause,
    stop,
    skip,
    skipBreak,
    setMode,
  } = usePomodoroTimer(
    focusDuration,
    shortBreak,
    longBreak,
    pomodorosBeforeLong,
    autoStartBreaks,
    selectedTask,
    user,
    todayCount,
    handleSessionsUpdate,
    handleLongBreakComplete,
    handleTaskComplete
  );

  // Derive current mode for the tab selector
  const currentMode: TimerMode = isBreak
    ? (sessionCount % pomodorosBeforeLong === 0 && sessionCount > 0 ? 'long_break' : 'short_break')
    : 'pomodoro';

  const handleModeChange = useCallback((mode: TimerMode) => {
    if (isRunning) return; // don't switch while running
    setMode(mode);
  }, [isRunning, setMode]);

  const totalTime = isBreak
    ? (sessionCount % pomodorosBeforeLong === 0 && sessionCount > 0 ? longBreak : shortBreak)
    : focusDuration;

  const isLongBreakUpcoming = sessionCount > 0 && sessionCount % pomodorosBeforeLong === 0;

  // Next task to suggest after task completion
  const nextTask = activeTasks.find((t) => t.id !== completedTask?.id) ?? null;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
      position: 'relative',
    },
    gradient: { flex: 1 },
    scrollContent: { paddingBottom: Spacing.xxl },
    header: {
      alignItems: 'center',
      paddingTop: 60,
      paddingBottom: Spacing.sm,
    },
    timerContainer: {
      alignItems: 'center',
      marginVertical: Spacing.md,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <StatusBar style={colors.isDark ? 'light' : 'dark'} />
      <LinearGradient
        colors={
          colors.isDark
            ? [colors.gradientStart, colors.gradientEnd]
            : [colors.background, colors.background]
        }
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Header */}
          <View style={styles.header}>
            <ThemedText variant="headlineSmall" color={colors.onSurface}>
              FocusFlow
            </ThemedText>
            <ThemedText variant="bodySmall" color={colors.onSurfaceVariant}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </ThemedText>
          </View>

          {/* Mode Switcher — Pomodoro / Short Break / Long Break */}
          <ModeSelector
            mode={currentMode}
            onChange={handleModeChange}
            disabled={isRunning}
          />

          {/* Pomodoro dot counter */}
          <PomodoroDotsRow
            completed={sessionCount}
            cycleSize={pomodorosBeforeLong}
          />

          {/* Focus Ring */}
          <View style={styles.timerContainer}>
            <FocusRing
              timeLeft={timeLeft}
              totalTime={totalTime}
              isBreak={isBreak}
              selectedTaskTitle={selectedTask?.title}
              completedPomodoros={selectedTask?.completed_pomodoros}
              estimatedPomodoros={selectedTask?.estimated_pomodoros}
            />
          </View>

          {/* Controls */}
          <TimerControls
            isRunning={isRunning}
            isBreak={isBreak}
            onStart={start}
            onPause={pause}
            onStop={stop}
            onSkip={skip}
          />

          {/* Estimated finish time */}
          {!isBreak && activeTasks.length > 0 && (
            <EstimatedFinish
              tasks={activeTasks}
              selectedTask={selectedTask}
              focusDuration={focusDuration}
              shortBreak={shortBreak}
              longBreak={longBreak}
              pomodorosBeforeLong={pomodorosBeforeLong}
              sessionCount={sessionCount}
            />
          )}

          {/* Task Selection / Selected Task / Break Info */}
          {isBreak ? (
            <BreakCard
              isLongBreak={isLongBreakUpcoming}
              pomodorosBeforeLong={pomodorosBeforeLong}
              onSkipBreak={skipBreak}
            />
          ) : selectedTask ? (
            <SelectedTaskCard
              task={selectedTask}
              onChangeTask={() => { setSelectedTask(null); stop(); }}
            />
          ) : (
            <TaskSelector tasks={activeTasks} onSelect={setSelectedTask} />
          )}

          {/* Session History */}
          <SessionHistory
            sessions={sessions}
            period={sessionPeriod}
            loading={sessionsLoading}
            error={sessionsError}
            clearDisabled={currentSessionId !== null}
            onPeriodChange={setSessionPeriod}
            onClearSessions={clearSessions}
          />

        </ScrollView>
      </LinearGradient>

      {/* Cycle Complete Celebration */}
      <CelebrationOverlay
        visible={showCelebration}
        sessionCount={pomodorosBeforeLong}
        onDismiss={() => setShowCelebration(false)}
      />

      {/* Task Complete — prompt to continue with next task */}
      <TaskCompleteOverlay
        visible={completedTask !== null}
        completedTask={completedTask}
        nextTask={nextTask}
        onStartNext={(task) => {
          setCompletedTask(null);
          setSelectedTask(task);
        }}
        onTakeBreak={() => {
          setCompletedTask(null);
          setSelectedTask(null);
        }}
        onDismiss={() => {
          setCompletedTask(null);
          setSelectedTask(null);
        }}
      />
    </View>
  );
}
