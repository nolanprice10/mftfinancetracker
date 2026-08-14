-- Debug records are internal diagnostics and must never be readable through the public API.
ALTER TABLE IF EXISTS public.trigger_debug_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.trigger_debug_log FROM anon, authenticated;

-- SECURITY DEFINER functions must use a fixed schema resolution path.
ALTER FUNCTION public.generate_referral_code() SET search_path = public;
ALTER FUNCTION public.get_or_create_referral_code(uuid) SET search_path = public;
ALTER FUNCTION public.handle_completed_referral() SET search_path = public;