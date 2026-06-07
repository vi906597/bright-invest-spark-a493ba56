
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.add_daily_interest() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.add_daily_interest() FROM PUBLIC, anon, authenticated;
