-- BuildConnect: быстрая подготовка БД к защите диплома
-- НЕ заменяет миграции. Сначала примените все файлы из supabase/migrations/ (31 шт.)
--
-- Рекомендуемый порядок (CLI):
--   cd buildconnectmarket
--   npx supabase link --project-ref ВАШ_REF
--   npx supabase db push
--
-- Затем в SQL Editor (по порядку):
--   1) seed_test_accounts.sql
--   2) seed_moderator_account.sql
--
-- Пароль всех тестовых пользователей: 123456

-- Проверка: ключевые таблицы существуют
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
    RAISE EXCEPTION 'Таблица companies не найдена. Сначала выполните supabase db push (миграции).';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'moderation_actions') THEN
    RAISE EXCEPTION 'Таблица moderation_actions не найдена. Примените миграции 20260526–20260528.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
    RAISE EXCEPTION 'Таблица reports не найдена. Примените миграцию 20260522120000_trust_reviews_and_reports.sql';
  END IF;
  RAISE NOTICE 'OK: базовые таблицы на месте. Выполните seed_test_accounts.sql и seed_moderator_account.sql';
END $$;
