export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) return { valid: false, message: 'Email is required' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return { valid: false, message: 'Please enter a valid email address' };
  return { valid: true };
}

export function validatePassword(password: string, confirm?: string): ValidationResult {
  if (!password) return { valid: false, message: 'Password is required' };
  if (password.length < 6) return { valid: false, message: 'Password must be at least 6 characters' };
  if (confirm !== undefined && password !== confirm) return { valid: false, message: 'Passwords do not match' };
  return { valid: true };
}

export function validateDisplayName(name: string): ValidationResult {
  if (!name.trim()) return { valid: false, message: 'Display name is required' };
  if (name.trim().length < 2) return { valid: false, message: 'Display name must be at least 2 characters' };
  if (name.trim().length > 50) return { valid: false, message: 'Display name must be less than 50 characters' };
  return { valid: true };
}

export function validateTaskTitle(title: string): ValidationResult {
  if (!title.trim()) return { valid: false, message: 'Task title is required' };
  if (title.trim().length > 200) return { valid: false, message: 'Title must be less than 200 characters' };
  return { valid: true };
}

export function validateEstimatedPomodoros(count: number): ValidationResult {
  if (!count || count < 1) return { valid: false, message: 'Must be at least 1 pomodoro' };
  if (count > 50) return { valid: false, message: 'Cannot exceed 50 pomodoros' };
  return { valid: true };
}

export function validateCategoryName(name: string): ValidationResult {
  if (!name.trim()) return { valid: false, message: 'Category name is required' };
  if (name.trim().length > 50) return { valid: false, message: 'Name must be less than 50 characters' };
  return { valid: true };
}

export function validateFocusDuration(minutes: number): ValidationResult {
  if (!minutes || minutes < 1) return { valid: false, message: 'Focus duration must be at least 1 minute' };
  if (minutes > 120) return { valid: false, message: 'Focus duration cannot exceed 120 minutes' };
  return { valid: true };
}

export function validateBreakDuration(minutes: number): ValidationResult {
  if (minutes < 1) return { valid: false, message: 'Break duration must be at least 1 minute' };
  if (minutes > 60) return { valid: false, message: 'Break duration cannot exceed 60 minutes' };
  return { valid: true };
}

export function validatePomodorosBeforeLong(count: number): ValidationResult {
  if (!count || count < 1) return { valid: false, message: 'Must be at least 1 pomodoro' };
  if (count > 20) return { valid: false, message: 'Cannot exceed 20 pomodoros' };
  return { valid: true };
}

export function validateDeadline(deadline: string | null): ValidationResult {
  if (!deadline) return { valid: true };
  const date = new Date(deadline);
  if (isNaN(date.getTime())) return { valid: false, message: 'Invalid date format' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return { valid: false, message: 'Deadline cannot be in the past' };
  return { valid: true };
}

export function validateTag(tag: string): ValidationResult {
  if (!tag.trim()) return { valid: false, message: 'Tag cannot be empty' };
  if (tag.trim().length > 30) return { valid: false, message: 'Tag must be less than 30 characters' };
  return { valid: true };
}
