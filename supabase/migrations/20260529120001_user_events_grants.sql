-- user_events создана после api_grants — без GRANT REST API отвечает permission denied
GRANT SELECT, INSERT ON public.user_events TO authenticated;
