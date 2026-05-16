-- Демо / защита диплома: пометить ВСЕ компании в БД как верифицированные.
-- В продакшене не использовать — перезапишет suspended/rejected/revoked.
--
-- Запуск: SQL Editor → Run (после миграций с колонкой verification_status).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'verification_status'
  ) THEN
    RAISE EXCEPTION 'Колонка companies.verification_status не найдена. Выполните supabase db push.';
  END IF;
END $$;

UPDATE public.companies
SET verification_status = 'verified',
    is_verified = true;

-- Проверка
SELECT id, name, verification_status, is_verified FROM public.companies ORDER BY name;
