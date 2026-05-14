-- Atomically completes a pomodoro session and updates the associated task.
-- Returns the updated task row so the client can sync state without a second query.
CREATE OR REPLACE FUNCTION public.complete_pomodoro_session(
  p_session_id   uuid,
  p_task_id      uuid,
  p_actual_duration integer,
  p_end_time     timestamptz DEFAULT now()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task          public.tasks%ROWTYPE;
  v_new_completed integer;
  v_task_done     boolean;
BEGIN
  -- 1. Mark the session as completed
  UPDATE public.pomodoro_sessions
  SET
    status         = 'completed',
    end_time       = p_end_time,
    actual_duration = p_actual_duration
  WHERE id = p_session_id;

  -- 2. Lock the task row and read current counts
  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found', p_task_id;
  END IF;

  v_new_completed := v_task.completed_pomodoros + 1;
  v_task_done     := v_new_completed >= v_task.estimated_pomodoros;

  -- 3. Update the task
  UPDATE public.tasks
  SET
    completed_pomodoros = v_new_completed,
    status              = CASE WHEN v_task_done THEN 'completed' ELSE 'in_progress' END,
    updated_at          = now()
  WHERE id = p_task_id
  RETURNING * INTO v_task;

  -- 4. Return the updated task as JSON
  RETURN row_to_json(v_task);
END;
$$;

-- Only the authenticated user who owns the task can call this
REVOKE ALL ON FUNCTION public.complete_pomodoro_session(uuid, uuid, integer, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_pomodoro_session(uuid, uuid, integer, timestamptz) TO authenticated;
;
