-- Включить таблицы в публикацию Realtime (Supabase), чтобы клиент получал postgres_changes по WebSocket.
-- Идемпотентно: повторный запуск не падает, если таблица уже в публикации.

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
