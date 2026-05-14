import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, x-client-info, apikey",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

/**
 * reset-account-data Edge Function
 *
 * Wipes all activity data for the authenticated user:
 *   - pomodoro_sessions  (session history + analytics source)
 *   - tasks              (behavioural data)
 *   - categories         (task metadata)
 *   - daily_schedules    (generated telemetry)
 *
 * Then invalidates ALL active auth sessions globally.
 * Core account (profiles, user_preferences, auth.users) is preserved.
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // ── Auth verification ─────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing or invalid Authorization header" }, 401);
  }
  const jwt = authHeader.slice(7);

  // Verify JWT with user-scoped client (anon key)
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { auth: { persistSession: false } }
  );

  const { data: { user }, error: userError } = await userClient.auth.getUser(jwt);
  if (userError || !user) {
    console.error("Auth verification failed:", userError?.message);
    return json({ error: "Unauthorized" }, 401);
  }
  const userId = user.id;
  console.log(`reset-account-data: starting wipe for user ${userId}`);

  // ── Service-role client for privileged deletes ────────────────────────────
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // ── Data wipe ─────────────────────────────────────────────────────────────
  const errors: string[] = [];

  // 1. Pomodoro sessions
  const { error: sessErr } = await admin
    .from("pomodoro_sessions")
    .delete()
    .eq("user_id", userId);
  if (sessErr) {
    console.error("pomodoro_sessions delete error:", sessErr.message);
    errors.push(`pomodoro_sessions: ${sessErr.message}`);
  }

  // 2. Tasks
  const { error: taskErr } = await admin
    .from("tasks")
    .delete()
    .eq("user_id", userId);
  if (taskErr) {
    console.error("tasks delete error:", taskErr.message);
    errors.push(`tasks: ${taskErr.message}`);
  }

  // 3. Categories
  const { error: catErr } = await admin
    .from("categories")
    .delete()
    .eq("user_id", userId);
  if (catErr) {
    console.error("categories delete error:", catErr.message);
    errors.push(`categories: ${catErr.message}`);
  }

  // 4. Daily schedules
  const { error: schedErr } = await admin
    .from("daily_schedules")
    .delete()
    .eq("user_id", userId);
  if (schedErr) {
    console.error("daily_schedules delete error:", schedErr.message);
    errors.push(`daily_schedules: ${schedErr.message}`);
  }

  if (errors.length > 0) {
    return json({ error: "Partial failure during data wipe", details: errors }, 500);
  }

  // ── Invalidate all auth sessions globally ─────────────────────────────────
  const { error: signOutErr } = await admin.auth.admin.signOut(userId, "global");
  if (signOutErr) {
    // Non-fatal: data is already wiped. Log and continue.
    console.warn("Global sign-out warning:", signOutErr.message);
  }

  console.log(`reset-account-data: completed successfully for user ${userId}`);
  return json({ success: true, message: "Account data reset successfully" }, 200);
});
