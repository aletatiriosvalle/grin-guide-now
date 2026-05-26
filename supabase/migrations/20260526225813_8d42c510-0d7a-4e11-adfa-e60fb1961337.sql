
DROP POLICY IF EXISTS "Public can view appointment by token" ON public.appointments;
DROP POLICY IF EXISTS "Public can update appointment by token" ON public.appointments;
DROP POLICY IF EXISTS "Public can view patient name for appointment" ON public.patients;

REVOKE SELECT, UPDATE ON public.appointments FROM anon;
REVOKE SELECT ON public.patients FROM anon;
