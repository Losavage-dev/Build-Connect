-- Выполните в Supabase → SQL Editor (один раз)
-- Заполняет city у существующих тендеров

UPDATE public.tenders
SET city = 'Алматы', updated_at = now()
WHERE city IS NULL
  AND title = 'Строительство коттеджа 200 кв.м';

UPDATE public.tenders
SET city = 'Астана', updated_at = now()
WHERE city IS NULL
  AND title = 'Капитальный ремонт офиса';

UPDATE public.tenders
SET city = 'Шымкент', updated_at = now()
WHERE city IS NULL
  AND title = 'Заливка фундамента';

UPDATE public.tenders t
SET city = COALESCE(NULLIF(trim(p.city), ''), 'Алматы'), updated_at = now()
FROM public.profiles p
WHERE t.client_id = p.id
  AND t.city IS NULL;

UPDATE public.tenders
SET city = 'Алматы', updated_at = now()
WHERE city IS NULL;

-- Проверка
SELECT id, title, status, city FROM public.tenders ORDER BY created_at;
