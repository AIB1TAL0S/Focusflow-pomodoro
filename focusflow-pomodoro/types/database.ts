export interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  priority: number;
  estimated_pomodoros: number;
  completed_pomodoros: number;
  deadline: string | null;
  energy_level: 'low' | 'medium' | 'high';
  focus_tags: string[];
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface PomodoroSession {
  id: string;
  user_id: string;
  task_id: string | null;
  start_time: string;
  end_time: string | null;
  planned_duration: number;
  actual_duration: number | null;
  status: 'running' | 'completed' | 'cancelled' | 'paused';
  break_duration: number;
  session_number: number;
  created_at: string;
  task?: Task;
}

export interface DailySchedule {
  id: string;
  user_id: string;
  date: string;
  schedule: ScheduleEntry[];
  algorithm_version: string;
  generated_at: string;
  accepted: boolean;
}

export interface ScheduleEntry {
  task_id: string;
  start_time: string;
  duration: number;
  pomodoro_count: number;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  focus_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  pomodoros_before_long_break: number;
  auto_start_breaks: boolean;
  notifications_enabled: boolean;
  theme: string;
  created_at: string;
  updated_at: string;
}
