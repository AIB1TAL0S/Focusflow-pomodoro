import { supabase } from '@/lib/supabase';
import { Task, UserPreferences, DailySchedule, ScheduleEntry, ScheduleEntryType } from '@/types/database';

// ─── Priority scoring ────────────────────────────────────────────────────────

function priorityScore(task: Task): number {
  const remainingPomodoros = Math.max(
    0,
    task.estimated_pomodoros - task.completed_pomodoros
  );
  let score = task.priority * 10;
  score += remainingPomodoros * 2;

  if (task.deadline) {
    const hoursLeft = (new Date(task.deadline).getTime() - Date.now()) / 3_600_000;
    if (hoursLeft < 0)   score += 50; // overdue
    else if (hoursLeft < 24)  score += 30;
    else if (hoursLeft < 72)  score += 15;
  }

  return score;
}

const activeTaskStatuses: Task['status'][] = ['pending', 'scheduled', 'in_progress'];

export function getRemainingTaskPomodoros(tasks: Task[]): number {
  return tasks
    .filter((task) => activeTaskStatuses.includes(task.status))
    .reduce(
      (sum, task) =>
        sum + Math.max(0, task.estimated_pomodoros - task.completed_pomodoros),
      0
    );
}

function sessionsUntilNextCycle(sessionCount: number, cycleSize: number): number {
  const normalizedCycleSize = Math.max(1, cycleSize);
  const position = sessionCount % normalizedCycleSize;
  return position === 0 ? normalizedCycleSize : normalizedCycleSize - position;
}

function countRemainingFocusSessions(
  remainingTaskPomodoros: number,
  pomodorosBeforeLong: number,
  initialSessionCount: number
): number {
  let totalFocusSessions = 0;
  let sessionCount = Math.max(0, initialSessionCount);

  for (let pomodoro = 0; pomodoro < remainingTaskPomodoros; pomodoro++) {
    const sessionsForPomodoro = sessionsUntilNextCycle(
      sessionCount,
      pomodorosBeforeLong
    );

    totalFocusSessions += sessionsForPomodoro;
    sessionCount += sessionsForPomodoro;
  }

  return totalFocusSessions;
}

export function calculateRemainingTimelineDuration(
  remainingTaskPomodoros: number,
  focusDuration: number,
  shortBreakDuration: number,
  longBreakDuration: number,
  pomodorosBeforeLong: number,
  initialSessionCount: number
): number {
  let totalDuration = 0;
  let sessionCount = Math.max(0, initialSessionCount);
  const remainingFocusSessions = countRemainingFocusSessions(
    remainingTaskPomodoros,
    pomodorosBeforeLong,
    initialSessionCount
  );

  for (let session = 0; session < remainingFocusSessions; session++) {
    totalDuration += focusDuration;
    sessionCount++;

    if (session < remainingFocusSessions - 1) {
      const isLongBreak = sessionCount % Math.max(1, pomodorosBeforeLong) === 0;
      totalDuration += isLongBreak ? longBreakDuration : shortBreakDuration;
    }
  }

  return totalDuration;
}

// ─── Client-side scheduler ───────────────────────────────────────────────────

/**
 * Builds a full timeline starting from NOW, including explicit break entries.
 * Breaks are inserted only between focus blocks, so the final work block does
 * not add time after all remaining task pomodoros are complete.
 */
function buildTimeline(
  tasks: Task[],
  prefs: UserPreferences,
  initialSessionCount = 0
): ScheduleEntry[] {
  const focusMins   = prefs.focus_duration;
  const shortMins   = prefs.short_break_duration;
  const longMins    = prefs.long_break_duration;
  const beforeLong  = Math.max(1, prefs.pomodoros_before_long_break);

  // Sort by priority, skip fully-completed tasks
  const sorted = [...tasks]
    .filter(t => activeTaskStatuses.includes(t.status) &&
                 t.estimated_pomodoros - t.completed_pomodoros > 0)
    .sort((a, b) => priorityScore(b) - priorityScore(a));

  const entries: ScheduleEntry[] = [];
  // Start from the current minute (device local time)
  let cursor = new Date();
  cursor.setSeconds(0, 0);

  let globalSessionCount = Math.max(0, initialSessionCount);
  const totalFocusSessions = countRemainingFocusSessions(
    getRemainingTaskPomodoros(sorted),
    beforeLong,
    globalSessionCount
  );
  let scheduledFocusSessions = 0;

  for (const task of sorted) {
    let remainingTaskPomodoros =
      task.estimated_pomodoros - task.completed_pomodoros;

    while (remainingTaskPomodoros > 0) {
      const sessionsForPomodoro = sessionsUntilNextCycle(
        globalSessionCount,
        beforeLong
      );

      for (let i = 0; i < sessionsForPomodoro; i++) {
        // ── Focus block ────────────────────────────────────────────────────
        entries.push({
          task_id: task.id,
          start_time: cursor.toISOString(),
          duration: focusMins,
          pomodoro_count: 1,
          type: 'focus',
        });
        cursor = new Date(cursor.getTime() + focusMins * 60_000);
        globalSessionCount++;
        scheduledFocusSessions++;

        // ── Break between focus blocks ─────────────────────────────────────
        if (scheduledFocusSessions < totalFocusSessions) {
          const isLong = globalSessionCount % beforeLong === 0;
          const breakMins = isLong ? longMins : shortMins;
          const breakType: ScheduleEntryType = isLong ? 'long_break' : 'short_break';

          entries.push({
            task_id: null,
            start_time: cursor.toISOString(),
            duration: breakMins,
            pomodoro_count: 0,
            type: breakType,
          });
          cursor = new Date(cursor.getTime() + breakMins * 60_000);
        }
      }

      remainingTaskPomodoros--;
    }
  }

  return entries;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function generateSchedule(
  tasks: Task[],
  preferences: UserPreferences,
  date: string,
  initialSessionCount = 0
): { schedule: DailySchedule; error: null } | { schedule: null; error: Error } {
  try {
    const entries = buildTimeline(tasks, preferences, initialSessionCount);

    return {
      schedule: {
        id: '',
        user_id: '',
        date,
        schedule: entries,
        algorithm_version: 'v3-cycle-progress',
        generated_at: new Date().toISOString(),
        accepted: false,
      },
      error: null,
    };
  } catch (err) {
    return { schedule: null, error: err as Error };
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
    .upsert(
      { user_id: userId, date, schedule, algorithm_version: algorithmVersion, accepted: true },
      { onConflict: 'user_id,date' }
    );

  return { error: error as Error | null };
}
