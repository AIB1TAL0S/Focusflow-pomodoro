import { supabase } from './supabase';

export interface ResetResult {
  success: boolean;
  error: string | null;
}

/**
 * Calls the `reset-account-data` Edge Function.
 *
 * The function:
 *   1. Deletes all pomodoro_sessions, tasks, categories, and daily_schedules
 *      for the authenticated user.
 *   2. Performs a global sign-out, invalidating every active auth session.
 *
 * The caller is responsible for clearing local auth state and redirecting
 * to the login screen after this resolves.
 */
export async function resetAccountData(): Promise<ResetResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'No active session found. Please sign in again.' };
    }

    const { data, error } = await supabase.functions.invoke('reset-account-data', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      // FunctionsFetchError / FunctionsHttpError — extract the most useful message
      const detail =
        (error as { context?: { message?: string }; message?: string })?.context?.message
        ?? error.message
        ?? 'Failed to reach the server. Check your connection and try again.';
      console.error('[resetAccountData] edge function error:', error);
      return { success: false, error: detail };
    }

    if (data?.error) {
      return { success: false, error: data.error };
    }

    return { success: true, error: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error occurred';
    console.error('[resetAccountData] unexpected error:', e);
    return { success: false, error: message };
  }
}
