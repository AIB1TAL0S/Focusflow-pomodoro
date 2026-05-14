import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { schedulePomodoroNotification, cancelScheduledNotifications } from '@/lib/notifications';
import { Task } from '@/types/database';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

interface TimerControls {
  start: () => Promise<void>;
  pause: () => void;
  stop: () => Promise<void>;
  skip: () => Promise<void>;
  skipBreak: () => Promise<void>;
}

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  sessionCount: number;
  currentSessionId: string | null;
}

export function usePomodoroTimer(
  focusDuration: number,
  shortBreak: number,
  longBreak: number,
  pomodorosBeforeLong: number,
  autoStartBreaks: boolean,
  selectedTask: Task | null,
  user: { id: string } | null,
  initialSessionCount: number,
  onSessionsUpdate: () => void
): TimerState & TimerControls {
  const [timeLeft, setTimeLeft] = useState(focusDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(initialSessionCount);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Keep a ref for the latest sessionCount so callbacks don't have stale closures
  const sessionCountRef = useRef(initialSessionCount);
  useEffect(() => {
    sessionCountRef.current = sessionCount;
  }, [sessionCount]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completingRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoStartTimeoutRef.current) {
      clearTimeout(autoStartTimeoutRef.current);
      autoStartTimeoutRef.current = null;
    }
  }, []);

  const cancelNotifications = useCallback(async () => {
    try {
      await cancelScheduledNotifications();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }, []);

  const handleComplete = useCallback(async () => {
    // Guard against double-invocation from interval cleanup race
    if (completingRef.current) return;
    completingRef.current = true;

    setIsRunning(false);
    clearAllTimers();
    await cancelNotifications();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    let newSessionCount = sessionCountRef.current;

    if (!isBreak && currentSessionId) {
      const actualDuration = Math.round((focusDuration - timeLeft) / 60);
      await supabase
        .from('pomodoro_sessions')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          actual_duration: actualDuration,
        })
        .eq('id', currentSessionId);

      if (selectedTask) {
        const newCompleted = selectedTask.completed_pomodoros + 1;
        await supabase
          .from('tasks')
          .update({
            completed_pomodoros: newCompleted,
            status: newCompleted >= selectedTask.estimated_pomodoros ? 'completed' : 'in_progress',
          })
          .eq('id', selectedTask.id);
      }
      newSessionCount = sessionCountRef.current + 1;
      setSessionCount(newSessionCount);
    }

    const nextIsBreak = !isBreak;
    setIsBreak(nextIsBreak);

    // Use the LOCAL newSessionCount (not the stale closure variable)
    const breakDuration =
      newSessionCount % pomodorosBeforeLong === 0 && newSessionCount > 0 ? longBreak : shortBreak;
    setTimeLeft(nextIsBreak ? breakDuration : focusDuration);
    setCurrentSessionId(null);
    onSessionsUpdate();

    // Reset the completing guard after a short delay
    setTimeout(() => {
      completingRef.current = false;
    }, 500);

    if (nextIsBreak && autoStartBreaks) {
      autoStartTimeoutRef.current = setTimeout(() => {
        setIsRunning(true);
      }, 1000);
    }
  }, [
    isBreak, currentSessionId, focusDuration, timeLeft, selectedTask,
    pomodorosBeforeLong, longBreak, shortBreak,
    autoStartBreaks, clearAllTimers, cancelNotifications, onSessionsUpdate
  ]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Don't call handleComplete here — let the timeLeft === 0 effect handle it
            // to avoid race conditions and double-invocation
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  // Separate effect triggers completion exactly once when timeLeft hits 0
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      handleComplete();
    }
  }, [timeLeft, isRunning, handleComplete]);

  const start = useCallback(async () => {
    if (!selectedTask && !isBreak) {
      Alert.alert('Select a Task', 'Please select a task to focus on');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(true);

    await cancelNotifications();
    const currentCount = sessionCountRef.current;
    const totalSeconds = isBreak
      ? (currentCount % pomodorosBeforeLong === 0 && currentCount > 0 ? longBreak : shortBreak)
      : focusDuration;
    await schedulePomodoroNotification(
      isBreak ? 'Break Complete' : 'Focus Session Complete',
      isBreak ? 'Ready to return to focus?' : `Completed session on ${selectedTask?.title || 'your task'}`,
      Math.max(1, totalSeconds)
    ).catch(console.error);

    if (!isBreak && selectedTask && user) {
      const { data } = await supabase
        .from('pomodoro_sessions')
        .insert({
          user_id: user.id,
          task_id: selectedTask.id,
          start_time: new Date().toISOString(),
          planned_duration: focusDuration / 60,
          session_number: currentCount + 1,
        })
        .select()
        .single();
      if (data) setCurrentSessionId(data.id);
    }
  }, [
    selectedTask, isBreak, pomodorosBeforeLong,
    longBreak, shortBreak, focusDuration, user, cancelNotifications,
    schedulePomodoroNotification
  ]);

  const pause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
  }, []);

  const stop = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRunning(false);
    clearAllTimers();
    await cancelNotifications();

    if (currentSessionId) {
      const actualDuration = Math.round((focusDuration - timeLeft) / 60);
      await supabase
        .from('pomodoro_sessions')
        .update({
          status: 'cancelled',
          end_time: new Date().toISOString(),
          actual_duration: actualDuration,
        })
        .eq('id', currentSessionId);
    }

    setTimeLeft(isBreak ? shortBreak : focusDuration);
    setIsBreak(false);
    setCurrentSessionId(null);
    onSessionsUpdate();
  }, [
    clearAllTimers, cancelNotifications, currentSessionId,
    focusDuration, timeLeft, isBreak, shortBreak, onSessionsUpdate
  ]);

  const skip = useCallback(async () => {
    if (!isRunning || isBreak) return;
    if (!selectedTask) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsRunning(false);
    clearAllTimers();
    await cancelNotifications();

    const newSessionCount = sessionCountRef.current; // Do not increment for skipped work session
    const isLongBreak = newSessionCount % pomodorosBeforeLong === 0 && newSessionCount > 0;

    if (currentSessionId) {
      await supabase
        .from('pomodoro_sessions')
        .update({
          status: 'skipped',
          end_time: new Date().toISOString(),
          actual_duration: 0,
        })
        .eq('id', currentSessionId);
    } else if (user && selectedTask) {
      await supabase
        .from('pomodoro_sessions')
        .insert({
          user_id: user.id,
          task_id: selectedTask.id,
          start_time: new Date().toISOString(),
          planned_duration: focusDuration / 60,
          session_number: newSessionCount + 1, // Still use +1 for session_number in DB
          status: 'skipped',
          end_time: new Date().toISOString(),
          actual_duration: 0,
        });
    }

    // Do not increment sessionCount for skipped work session
    setIsBreak(true);
    setTimeLeft(isLongBreak ? longBreak : shortBreak);
    setCurrentSessionId(null);
    onSessionsUpdate();

    if (autoStartBreaks) {
      autoStartTimeoutRef.current = setTimeout(() => {
        setIsRunning(true);
      }, 1000);
    }
  }, [
    isRunning, isBreak, selectedTask, pomodorosBeforeLong,
    currentSessionId, longBreak, clearAllTimers, cancelNotifications,
    autoStartBreaks, onSessionsUpdate, user, focusDuration
  ]);

  const skipBreak = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    clearAllTimers();
    await cancelNotifications();

    const newSessionCount = sessionCountRef.current + 1;
    setSessionCount(newSessionCount);
    setIsBreak(false);
    setTimeLeft(focusDuration);
    setCurrentSessionId(null);
    onSessionsUpdate();
  }, [
    focusDuration, clearAllTimers, cancelNotifications, onSessionsUpdate
  ]);

  return {
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
  };
}
