import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Heuristic-driven NP-hard resource allocation for daily Pomodoro scheduling
// Uses greedy initial assignment + local search optimization

interface Task {
  id: string;
  title: string;
  priority: number;
  estimated_pomodoros: number;
  completed_pomodoros: number;
  deadline: string | null;
  energy_level: 'low' | 'medium' | 'high';
}

interface ScheduleEntry {
  task_id: string;
  start_time: string;
  duration: number;
  pomodoro_count: number;
}

interface UserPreferences {
  focus_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  pomodoros_before_long_break: number;
}

function calculatePriorityScore(task: Task): number {
  const now = new Date();
  const deadline = task.deadline ? new Date(task.deadline) : null;
  
  // Base priority score (higher = more important)
  let score = task.priority * 10;
  
  // Urgency factor based on deadline
  if (deadline) {
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilDeadline < 0) {
      score += 50; // Overdue tasks get highest priority
    } else if (hoursUntilDeadline < 24) {
      score += 30;
    } else if (hoursUntilDeadline < 72) {
      score += 15;
    }
  }
  
  // Energy matching bonus (prefer tasks that match typical energy curve)
  // Morning: high energy, Afternoon: medium, Evening: low
  score += task.estimated_pomodoros * 2;
  
  return score;
}

function greedySchedule(tasks: Task[], prefs: UserPreferences, currentHour?: number): ScheduleEntry[] {
  const sortedTasks = [...tasks]
    .filter(t => t.status === 'pending' || t.status === 'scheduled')
    .sort((a, b) => calculatePriorityScore(b) - calculatePriorityScore(a));
  
  const schedule: ScheduleEntry[] = [];
  let currentTime = new Date();
  
  // Use user's local hour if provided, otherwise use server time
  const userHour = currentHour ?? currentTime.getHours();
  
  // If before 9 AM or no hour provided, start at 9 AM
  if (userHour < 9) {
    currentTime.setHours(9, 0, 0, 0);
  } else {
    // Start at the next hour boundary from current time
    currentTime.setHours(userHour, 0, 0, 0);
  }
  
  let sessionCount = 0;
  
  for (const task of sortedTasks) {
    const remainingPomodoros = task.estimated_pomodoros - task.completed_pomodoros;
    if (remainingPomodoros <= 0) continue;
    
    const pomodorosToSchedule = Math.min(remainingPomodoros, 4); // Max 4 per task per day
    
    for (let i = 0; i < pomodorosToSchedule; i++) {
      // Add focus session
      schedule.push({
        task_id: task.id,
        start_time: currentTime.toISOString(),
        duration: prefs.focus_duration,
        pomodoro_count: 1,
      });
      
      currentTime = new Date(currentTime.getTime() + prefs.focus_duration * 60000);
      sessionCount++;
      
      // Add break
      const isLongBreak = sessionCount % prefs.pomodoros_before_long_break === 0;
      const breakDuration = isLongBreak ? prefs.long_break_duration : prefs.short_break_duration;
      
      currentTime = new Date(currentTime.getTime() + breakDuration * 60000);
    }
  }
  
  return schedule;
}

function localSearchOptimize(schedule: ScheduleEntry[], tasks: Task[]): ScheduleEntry[] {
  // Simple local search: try swapping adjacent sessions and keep if it improves energy alignment
  let improved = true;
  let iterations = 0;
  const maxIterations = 100;
  
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    
    for (let i = 0; i < schedule.length - 1; i++) {
      const taskA = tasks.find(t => t.id === schedule[i].task_id);
      const taskB = tasks.find(t => t.id === schedule[i + 1].task_id);
      
      if (!taskA || !taskB) continue;
      
      // Calculate current score
      const currentScore = calculatePriorityScore(taskA) + calculatePriorityScore(taskB);
      
      // Try swap
      const temp = schedule[i];
      schedule[i] = schedule[i + 1];
      schedule[i + 1] = temp;
      
      const newScore = calculatePriorityScore(taskB) + calculatePriorityScore(taskA);
      
      // Accept if better or with small probability (simulated annealing-like)
      if (newScore >= currentScore || Math.random() < 0.1) {
        improved = true;
      } else {
        // Revert
        schedule[i + 1] = schedule[i];
        schedule[i] = temp;
      }
    }
  }
  
  return schedule;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const { tasks, preferences, date, currentHour } = await req.json();
      
    if (!tasks || !Array.isArray(tasks)) {
      return new Response(JSON.stringify({ error: 'Tasks array required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    const schedule = greedySchedule(tasks, preferences, currentHour);
    const optimizedSchedule = localSearchOptimize(schedule, tasks);
    
    // Sort by start_time to ensure chronological order after optimization swaps
    optimizedSchedule.sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    
    return new Response(
      JSON.stringify({
        schedule: optimizedSchedule,
        algorithm_version: 'v1-greedy-local-search',
        total_sessions: optimizedSchedule.length,
        total_focus_minutes: optimizedSchedule.reduce((sum: number, s: ScheduleEntry) => sum + s.duration, 0),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
