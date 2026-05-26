
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 30,
  treatment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_user_starts ON public.appointments(user_id, starts_at);
CREATE INDEX idx_patients_user ON public.patients(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_patients_select" ON public.patients FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_patients_insert" ON public.patients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_patients_update" ON public.patients FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_patients_delete" ON public.patients FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "own_appts_select" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_appts_insert" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_appts_update" ON public.appointments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_appts_delete" ON public.appointments FOR DELETE TO authenticated USING (auth.uid() = user_id);
