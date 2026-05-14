-- Replaces the completion RPC with a clamped version for databases that already
-- applied an earlier migration. Task progress increments only after the
-- long-break cycle is fulfilled; estimated_pomodoros never changes here.
DROP FUNCTION IF EXISTS public.complete_pomodoro_session(uuid, uuid, integer, timestamptz);
DROP FUNCTION IF EXISTS public.complete_pomodoro_session(uuid, uuid, integer, timestamptz, integer);

CREATE OR REPLACE FUNCTION public.complete_pomodoro_session(
  p_session_id uuid,
  p_task_id uuid,
  p_actual_duration integer,
  p_end_time timestamptz DEFAULT now(),
  p_pomodoros_before_long integer DEFAULT 4
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task public.tasks%ROWTYPE;
  v_session_number integer;
  v_cycle_size integer;
  v_cycle_complete boolean;
  v_new_completed integer;
  v_task_done boolean;
BEGIN
  v_cycle_size := GREATEST(COALESCE(p_pomodoros_before_long, 4), 1);

  UPDATE public.pomodoro_sessions
  SET
    status = 'completed',
    end_time = p_end_time,
    actual_duration = p_actual_duration
  WHERE id = p_session_id
    AND user_id = auth.uid()
  RETURNING session_number INTO v_session_number;

  IF v_session_number IS NULL THEN
    RAISE EXCEPTION 'Pomodoro session % not found', p_session_id;
  END IF;

  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id
    AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found', p_task_id;
  END IF;

  IF v_task.status = 'completed' OR v_task.completed_pomodoros >= v_task.estimated_pomodoros THEN
    UPDATE public.tasks
    SET
      completed_pomodoros = LEAST(v_task.completed_pomodoros, v_task.estimated_pomodoros),
      status = 'completed',
      updated_at = now()
    WHERE id = p_task_id
      AND user_id = auth.uid()
    RETURNING * INTO v_task;

    RETURN json_build_object(
      'task', row_to_json(v_task),
      'milestone_hit', false
    );
  END IF;

  v_cycle_complete := v_session_number > 0 AND v_session_number % v_cycle_size = 0;
  v_new_completed := CASE
    WHEN v_cycle_complete THEN LEAST(v_task.completed_pomodoros + 1, v_task.estimated_pomodoros)
    ELSE v_task.completed_pomodoros
  END;
  v_task_done := v_new_completed >= v_task.estimated_pomodoros;

  UPDATE public.tasks
  SET
    completed_pomodoros = v_new_completed,
    status = CASE WHEN v_task_done THEN 'completed' ELSE 'in_progress' END,
    updated_at = now()
  WHERE id = p_task_id
    AND user_id = auth.uid()
  RETURNING * INTO v_task;

  RETURN json_build_object(
    'task', row_to_json(v_task),
    'milestone_hit', v_cycle_complete
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_pomodoro_session(uuid, uuid, integer, timestamptz, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_pomodoro_session(uuid, uuid, integer, timestamptz, integer) TO authenticated;
