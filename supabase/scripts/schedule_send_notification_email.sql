-- Автоотправка email: вызывает Edge Function send-notification-email каждые 5 минут.
--
-- Перед запуском:
-- 1. Dashboard → Database → Extensions → pg_cron и pg_net
-- 2. Замените YOUR_PROJECT_REF и YOUR_ANON_KEY (Settings → API → anon public)
-- 3. Edge Function задеплоена, secrets (RESEND_API_KEY и т.д.) заданы
--
-- Важно: без Authorization/apikey Supabase вернёт 401 UNAUTHORIZED_NO_AUTH_HEADER

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'send-notification-email-every-5-min';

SELECT cron.schedule(
  'send-notification-email-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY',
      'apikey', 'YOUR_ANON_KEY'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) AS request_id;
  $$
);

-- Проверка: список cron-заданий
SELECT jobid, jobname, schedule, command FROM cron.job
WHERE jobname = 'send-notification-email-every-5-min';
