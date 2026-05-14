import { useState, useRef, useCallback, useEffect } from 'react';
import { createSession, updateSession, completeSession, updateTask } from '@/lib/api';
import {
  schedulePomodoroNotification,
  cancelScheduledNotifications,
} from '@/lib/notifications';
import { Task } from '@/types/database';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

interface TimerControls {
  start: () => Promise<void>;
  pause: () => void;
  stop: () => Promise<void>;
  skip: () => Promise<void>;
  skipBreak: () => void;
  setMode: (mode: 'pomodoro' | 'short_break' | 'long_break') => void;
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
  onSessionsUpdate: () => void,
  onLongBreakComplete?: () => void,
  onTaskComplete?: (completedTask: Task) => void
): TimerState & TimerControls {
  const [timeLeft, setTimeLeft] = useState(focusDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(initialSessionCount);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Refs mirror the latest state/props so async callbacks never read stale closures
  const sessionCountRef = useRef(initialSessionCount);
  const timeLeftRef = useRef(focusDuration);
  const isBreakRef = useRef(false);
  const currentSessionIdRef = useRef<string | null>(null);
  const isRunningRef = useRef(false);
  const selectedTaskRef = useRef<Task | null>(selectedTask);

  useEffect(() => { sessionCountRef.current = sessionCount; }, [sessionCount]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { isBreakRef.current = isBreak; }, [isBreak]);
  useEffect(() => { currentSessionIdRef.current = currentSessionId; }, [currentSessionId]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  // Keep selectedTask ref in sync so handleComplete always reads the latest pomodoro count
  useEffect(() => { selectedTaskRef.current = selectedTask; }, [selectedTask]);

  // Re-sync session count when the parent refreshes it (e.g. after navigating back)
  const prevInitialRef = useRef(initialSessionCount);
  useEffect(() => {
    if (initialSessionCount !== prevInitialRef.current && !isRunningRef.current) {
      prevInitialRef.current = initialSessionCount;
      setSessionCount(initialSessionCount);
      sessionCountRef.current = initialSessionCount;
    }
  }, [initialSessionCount]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completingRef = useRef(false);

  // ─── Helpers ────────────────────────────────────────────────────────────────

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
    } catch {
      // Silently ignore — platform may not support notifications
    }
  }, []);

  const getBreakDuration = useCallback(
    (count: number) =>
      count > 0 && count % pomodorosBeforeLong === 0 ? longBreak : shortBreak,
    [pomodorosBeforeLong, longBreak, shortBreak]
  );

  // ─── Shared: complete a focus session ────────────────────────────────────────

  const completeFocusSession = useCallback(
    async (sessionId: string) => {
      const currentTask = selectedTaskRef.current;
      const actualDuration = Math.round(
        (focusDuration - timeLeftRef.current) / 60
      );

      if (currentTask) {
        const { updatedTask, milestoneHit, error: rpcError } = await completeSession(
          sessionId,
          currentTask.id,
          actualDuration,
          pomodorosBeforeLong
        );

        if (rpcError) {
          console.error('completeSession RPC error:', rpcError);
        } else {
          const nextSessionCount = sessionCountRef.current + 1;
          const cycleComplete =
            nextSessionCount > 0 && nextSessionCount % pomodorosBeforeLong === 0;
          const targetEstimatedPomodoros = currentTask.estimated_pomodoros;
          const targetCompletedPomodoros = cycleComplete
            ? Math.min(
                currentTask.completed_pomodoros + 1,
                targetEstimatedPomodoros
              )
            : currentTask.completed_pomodoros;
          const targetStatus: Task['status'] =
            targetCompletedPomodoros >= targetEstimatedPomodoros
              ? 'completed'
              : 'in_progress';

          if (
            !updatedTask ||
            updatedTask.completed_pomodoros !== targetCompletedPomodoros ||
            updatedTask.estimated_pomodoros !== targetEstimatedPomodoros ||
            updatedTask.status !== targetStatus
          ) {
            const { error: normalizeError } = await updateTask(currentTask.id, {
              completed_pomodoros: targetCompletedPomodoros,
              estimated_pomodoros: targetEstimatedPomodoros,
              status: targetStatus,
            });
            if (normalizeError) {
              console.error('normalize completed task error:', normalizeError);
            }
          }

          const normalizedTask: Task = {
            ...(updatedTask ?? currentTask),
            completed_pomodoros: targetCompletedPomodoros,
            estimated_pomodoros: targetEstimatedPomodoros,
            status: targetStatus,
          };

          if (targetStatus === 'completed') {
            onTaskComplete?.(normalizedTask);
          }
          if (milestoneHit || cycleComplete) {
            onLongBreakComplete?.();
          }
        }
      } else {
        await updateSession(sessionId, {
          status: 'completed',
          end_time: new Date().toISOString(),
          actual_duration: actualDuration,
        });
      }
    },
    [focusDuration, pomodorosBeforeLong, onLongBreakComplete, onTaskComplete]
  );

  // ─── Completion handler ──────────────────────────────────────────────────────

  const handleComplete = useCallback(async () => {
    if (completingRef.current) return;
    completingRef.current = true;

    setIsRunning(false);
    clearAllTimers();
    await cancelNotifications();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const wasBreak = isBreakRef.current;
    const sessionId = currentSessionIdRef.current;
    let newSessionCount = sessionCountRef.current;

    if (!wasBreak && sessionId) {
      await completeFocusSession(sessionId);

      newSessionCount = sessionCountRef.current + 1;
      setSessionCount(newSessionCount);
      sessionCountRef.current = newSessionCount;
    }

    const nextIsBreak = !wasBreak;
    setIsBreak(nextIsBreak);
    isBreakRef.current = nextIsBreak;

    const nextTime = nextIsBreak
      ? getBreakDuration(newSessionCount)
      : focusDuration;
    setTimeLeft(nextTime);
    timeLeftRef.current = nextTime;

    setCurrentSessionId(null);
    currentSessionIdRef.current = null;

    onSessionsUpdate();

    setTimeout(() => {
      completingRef.current = false;
    }, 500);

    if (nextIsBreak && autoStartBreaks) {
      autoStartTimeoutRef.current = setTimeout(() => {
        setIsRunning(true);
        isRunningRef.current = true;
      }, 1000);
    }
  }, [
    focusDuration,
    autoStartBreaks,
    getBreakDuration,
    clearAllTimers,
    cancelNotifications,
    onSessionsUpdate,
    completeFocusSession,
  ]);

  // ─── Countdown interval ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          timeLeftRef.current = 0;
          return 0;
        }
        const next = prev - 1;
        timeLeftRef.current = next;
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      handleComplete();
    }
  }, [timeLeft, isRunning, handleComplete]);

  // ─── Controls ────────────────────────────────────────────────────────────────

  const start = useCallback(async () => {
    if (!selectedTaskRef.current && !isBreakRef.current) {
      Alert.alert('Select a Task', 'Please select a task to focus on');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await cancelNotifications();

    const currentCount = sessionCountRef.current;
    const totalSeconds = isBreakRef.current
      ? getBreakDuration(currentCount)
      : focusDuration;

    schedulePomodoroNotification(
      isBreakRef.current ? 'Break Complete' : 'Focus Session Complete',
      isBreakRef.current
        ? 'Ready to return to focus?'
        : `Completed session on ${selectedTaskRef.current?.title ?? 'your task'}`,
      Math.max(1, totalSeconds)
    ).catch(() => {
      // Silently ignore on web
    });

    if (!isBreakRef.current && selectedTaskRef.current && user) {
      const { data, error } = await createSession({
        user_id: user.id,
        task_id: selectedTaskRef.current.id,
        start_time: new Date().toISOString(),
        planned_duration: focusDuration / 60,
        session_number: currentCount + 1,
      });

      if (error || !data) {
        Alert.alert(
          'Timer Not Started',
          'Could not create a pomodoro session. Please try again.'
        );
        return;
      }

      setCurrentSessionId(data.id);
      currentSessionIdRef.current = data.id;
    }

    setIsRunning(true);
    isRunningRef.current = true;
  }, [focusDuration, user, getBreakDuration, cancelNotifications]);

  const pause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
    isRunningRef.current = false;
  }, []);

  const stop = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRunning(false);
    isRunningRef.current = false;
    clearAllTimers();
    await cancelNotifications();

    const sessionId = currentSessionIdRef.current;
    if (sessionId) {
      await completeFocusSession(sessionId);
    }

    const newSessionCount = sessionCountRef.current + 1;
    setSessionCount(newSessionCount);
    sessionCountRef.current = newSessionCount;

    setTimeLeft(focusDuration);
    timeLeftRef.current = focusDuration;
    setIsBreak(false);
    isBreakRef.current = false;
    setCurrentSessionId(null);
    currentSessionIdRef.current = null;
    onSessionsUpdate();
  }, [focusDuration, completeFocusSession, clearAllTimers, cancelNotifications, onSessionsUpdate]);

  const skip = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    clearAllTimers();
    await cancelNotifications();

    const sessionId = currentSessionIdRef.current;
    if (sessionId) {
      const currentTask = selectedTaskRef.current;
      if (currentTask) {
        await completeFocusSession(sessionId);
      } else {
        await updateSession(sessionId, {
          status: 'cancelled',
          end_time: new Date().toISOString(),
          actual_duration: Math.round((focusDuration - timeLeftRef.current) / 60),
        });
      }
    }

    const nextCount = sessionCountRef.current + 1;
    const isLongBreak = nextCount > 0 && nextCount % pomodorosBeforeLong === 0;

    setIsRunning(false);
    isRunningRef.current = false;
    setSessionCount(nextCount);
    sessionCountRef.current = nextCount;
    setCurrentSessionId(null);
    currentSessionIdRef.current = null;
    setIsBreak(true);
    isBreakRef.current = true;

    const breakTime = isLongBreak ? longBreak : shortBreak;
    setTimeLeft(breakTime);
    timeLeftRef.current = breakTime;

    onSessionsUpdate();

    if (autoStartBreaks) {
      autoStartTimeoutRef.current = setTimeout(() => {
        setIsRunning(true);
        isRunningRef.current = true;
      }, 1000);
    }
  }, [
    focusDuration,
    pomodorosBeforeLong,
    longBreak,
    shortBreak,
    autoStartBreaks,
    clearAllTimers,
    cancelNotifications,
    onSessionsUpdate,
  ]);

  const skipBreak = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearAllTimers();
    cancelNotifications();

    setIsRunning(false);
    isRunningRef.current = false;
    setIsBreak(false);
    isBreakRef.current = false;
    setTimeLeft(focusDuration);
    timeLeftRef.current = focusDuration;
    setCurrentSessionId(null);
    currentSessionIdRef.current = null;
  }, [focusDuration, clearAllTimers, cancelNotifications]);

  /**
   * Manually switch mode (only when timer is not running).
   * Resets the timer to the appropriate duration for the selected mode.
   */
  const setMode = useCallback((mode: 'pomodoro' | 'short_break' | 'long_break') => {
    clearAllTimers();
    cancelNotifications();
    setIsRunning(false);
    isRunningRef.current = false;
    setCurrentSessionId(null);
    currentSessionIdRef.current = null;

    if (mode === 'pomodoro') {
      setIsBreak(false);
      isBreakRef.current = false;
      setTimeLeft(focusDuration);
      timeLeftRef.current = focusDuration;
    } else if (mode === 'short_break') {
      setIsBreak(true);
      isBreakRef.current = true;
      setTimeLeft(shortBreak);
      timeLeftRef.current = shortBreak;
    } else {
      setIsBreak(true);
      isBreakRef.current = true;
      setTimeLeft(longBreak);
      timeLeftRef.current = longBreak;
    }
  }, [focusDuration, shortBreak, longBreak, clearAllTimers, cancelNotifications]);

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
    setMode,
  };
}
