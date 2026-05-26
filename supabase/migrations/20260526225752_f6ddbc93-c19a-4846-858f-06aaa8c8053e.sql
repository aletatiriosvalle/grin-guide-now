
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS manage_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS reschedule_requested boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS appointments_manage_token_idx ON public.appointments(manage_token);
CREATE INDEX IF NOT EXISTS appointments_reminder_lookup_idx ON public.appointments(starts_at) WHERE reminder_sent_at IS NULL AND cancelled_at IS NULL;

-- Public access by token (anon role) — only minimal columns needed by the manage page
GRANT SELECT (id, patient_id, starts_at, duration_min, treatment, status, manage_token, cancelled_at, reschedule_requested, user_id), UPDATE (status, cancelled_at, reschedule_requested) ON public.appointments TO anon;
GRANT SELECT (id, full_name) ON public.patients TO anon;

CREATE POLICY "Public can view appointment by token"
  ON public.appointments FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can update appointment by token"
  ON public.appointments FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view patient name for appointment"
  ON public.patients FOR SELECT
  TO anon
  USING (true);
