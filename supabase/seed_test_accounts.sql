-- =============================================================================
-- BuildConnect: тестовые аккаунты для проверки ролей и сценариев
-- Запуск: Supabase Dashboard → SQL Editor → вставить весь файл → Run
-- Пароль у ВСЕХ аккаунтов: 123456
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Удаляем старые тестовые аккаунты (@test.com), чтобы скрипт можно было перезапускать
DELETE FROM auth.identities
WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@test.com');

DELETE FROM auth.users WHERE email LIKE '%@test.com';

DELETE FROM public.profiles
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- -----------------------------------------------------------------------------
-- auth.users (email подтверждён — можно входить сразу)
-- -----------------------------------------------------------------------------
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data, created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, is_sso_user
) VALUES
-- 1. Заказчик без компании
(
  'c8f33161-5ccf-4409-a1fc-224445582c01',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'client@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Азамат Заказчиков", "role": "client"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
-- 2. Подрядчик + компания (Алматы)
(
  'c8f33161-5ccf-4409-a1fc-224445582c02',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'contractor1@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Берик Строителев", "role": "contractor"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
-- 3. Подрядчик + компания (Астана)
(
  'c8f33161-5ccf-4409-a1fc-224445582c03',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'contractor2@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Данияр Монтажников", "role": "contractor"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
-- 4. Поставщик + компания (материалы)
(
  'c8f33161-5ccf-4409-a1fc-224445582c04',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'supplier@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Мадина Поставкина", "role": "supplier"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
-- 5. Поставщик БЕЗ компании
(
  'c8f33161-5ccf-4409-a1fc-224445582c05',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'supplier-noco@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Серик Поставщиков", "role": "supplier"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
-- 6. Заказчик С компанией (фаза 1: «Мои компании» у client)
(
  'c8f33161-5ccf-4409-a1fc-224445582c06',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'clientco@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Айгуль Заказова", "role": "client"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
-- 7. Подрядчик БЕЗ компании (не может откликаться на тендер)
(
  'c8f33161-5ccf-4409-a1fc-224445582c07',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'contractor-noco@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Нурлан Бригадиров", "role": "contractor"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
-- 8. Модератор (верификация компаний)
(
  'c8f33161-5ccf-4409-a1fc-224445582c08',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'moderator@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Алия Модераторова", "role": "moderator"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
);

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c01', 'client@test.com', 'email',
 '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c01", "email": "client@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c02', 'contractor1@test.com', 'email',
 '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c02", "email": "contractor1@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c03', 'contractor2@test.com', 'email',
 '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c03", "email": "contractor2@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c04', 'supplier@test.com', 'email',
 '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c04", "email": "supplier@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c05', 'supplier-noco@test.com', 'email',
 '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c05", "email": "supplier-noco@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c06', 'clientco@test.com', 'email',
 '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c06", "email": "clientco@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c07', 'contractor-noco@test.com', 'email',
 '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c07", "email": "contractor-noco@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c08', 'moderator@test.com', 'email',
 '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c08", "email": "moderator@test.com"}', now(), now(), now());

-- Профили (триггер уже создал строки; дополняем контакты)
UPDATE public.profiles SET
  first_name = 'Азамат', last_name = 'Заказчиков', phone = '+77011111101', city = 'Астана', role = 'client'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c01';

UPDATE public.profiles SET
  first_name = 'Берик', last_name = 'Строителев', phone = '+77011111102', city = 'Алматы', role = 'contractor'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c02';

UPDATE public.profiles SET
  first_name = 'Данияр', last_name = 'Монтажников', phone = '+77011111103', city = 'Астана', role = 'contractor'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c03';

UPDATE public.profiles SET
  first_name = 'Мадина', last_name = 'Поставкина', phone = '+77011111104', city = 'Астана', role = 'supplier'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c04';

UPDATE public.profiles SET
  first_name = 'Серик', last_name = 'Поставщиков', phone = '+77011111105', city = 'Шымкент', role = 'supplier'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c05';

UPDATE public.profiles SET
  first_name = 'Айгуль', last_name = 'Заказова', phone = '+77011111106', city = 'Астана', role = 'client'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c06';

UPDATE public.profiles SET
  first_name = 'Нурлан', last_name = 'Бригадиров', phone = '+77011111107', city = 'Алматы', role = 'contractor'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c07';

UPDATE public.profiles SET
  first_name = 'Алия', last_name = 'Модераторова', phone = '+77011111108', city = 'Астана', role = 'moderator'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c08';

-- -----------------------------------------------------------------------------
-- Компании, тендеры, услуги, материалы
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  p_client uuid;
  p_cont1 uuid;
  p_cont2 uuid;
  p_sup uuid;
  p_sup_noco uuid;
  p_clientco uuid;
  p_cont_noco uuid;
  c_alatau uuid;
  c_monolit uuid;
  c_materials uuid;
  c_clientco uuid;
BEGIN
  SELECT id INTO p_client FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c01';
  SELECT id INTO p_cont1 FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c02';
  SELECT id INTO p_cont2 FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c03';
  SELECT id INTO p_sup FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c04';
  SELECT id INTO p_sup_noco FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c05';
  SELECT id INTO p_clientco FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c06';
  SELECT id INTO p_cont_noco FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c07';

  INSERT INTO public.companies (owner_id, name, category, city, description, is_verified, rating, review_count)
  VALUES (p_cont1, 'Alatau Build LLP', 'Генеральный подряд', 'Алматы',
    'Генподряд, коттеджи и коммерция. Тестовая компания подрядчика 1.', true, 0, 0)
  RETURNING id INTO c_alatau;

  INSERT INTO public.companies (owner_id, name, category, city, description, is_verified, rating, review_count)
  VALUES (p_cont2, 'Astana Monolit', 'Бетонные работы', 'Астана',
    'Монолит, бетон, фундаменты. Тестовая компания подрядчика 2.', true, 0, 0)
  RETURNING id INTO c_monolit;

  INSERT INTO public.companies (owner_id, name, category, city, description, is_verified, rating, review_count)
  VALUES (p_sup, 'Steppe Materials', 'Материалы', 'Астана',
    'Поставка арматуры, бетона, кирпича. Тестовый поставщик.', true, 0, 0)
  RETURNING id INTO c_materials;

  INSERT INTO public.companies (owner_id, name, category, city, description, is_verified, rating, review_count)
  VALUES (p_clientco, 'ZakazTech LLP', 'Ремонт', 'Астана',
    'Компания заказчика с витриной — тест «клиент + компания».', true, 0, 0)
  RETURNING id INTO c_clientco;

  -- Категории компаний (если таблица есть)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_categories') THEN
    INSERT INTO public.company_categories (company_id, category) VALUES
      (c_alatau, 'Генеральный подряд'),
      (c_alatau, 'Строительство'),
      (c_monolit, 'Бетонные работы'),
      (c_materials, 'Материалы'),
      (c_clientco, 'Ремонт')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Тендеры заказчика (разные статусы)
  INSERT INTO public.tenders (client_id, title, description, budget, deadline, status, city, tender_type) VALUES
    (p_client, 'Строительство коттеджа 200 кв.м', 'Двухэтажный дом, черновая отделка', 45000000, '2026-09-01', 'open', 'Алматы', 'subcontract'),
    (p_client, 'Капитальный ремонт офиса', 'Ремонт 150 кв.м под ключ', 15000000, '2026-06-15', 'open', 'Астана', 'subcontract'),
    (p_client, 'Заливка фундамента', 'Ленточный фундамент под склад', 3000000, '2026-05-20', 'open', 'Шымкент', 'subcontract'),
    (p_client, 'Фасад торгового центра', 'Утепление и облицовка — исполнитель выбран', 22000000, '2026-04-01', 'in_progress', 'Алматы', 'subcontract'),
    (p_client, 'Старый склад — демонтаж', 'Тендер закрыт, работы не актуальны', 800000, '2025-12-01', 'closed', 'Астана', 'subcontract');

  -- Тендер поставщика без компании (отклики → в профиль)
  INSERT INTO public.tenders (client_id, title, description, budget, deadline, status, city, tender_type) VALUES
    (p_sup_noco, 'Нужна доставка цемента на объект', 'Доставка М400, 30 тонн, Астана', 450000, '2026-05-25', 'open', 'Астана', 'logistics');

  -- Тендер поставщика с компанией
  INSERT INTO public.tenders (client_id, title, description, budget, deadline, status, city, tender_type) VALUES
    (p_sup, 'Ищем бригаду для разгрузки склада', 'Разгрузка и складирование материалов', 350000, '2026-05-30', 'open', 'Астана', 'subcontract');

  -- Услуги подрядчиков
  INSERT INTO public.services (company_id, title, description, price, category) VALUES
    (c_alatau, 'Возведение стен из газоблока', 'Кладка с соблюдением технологии', 8000, 'Кладка'),
    (c_alatau, 'Отделка фасада травертином', 'Натуральный камень', 12000, 'Фасады'),
    (c_monolit, 'Заливка бетона М300', 'Свой узел, доставка миксером', 25000, 'Бетонные работы'),
    (c_clientco, 'Мелкий ремонт офиса', 'Косметический ремонт под ключ', 1500000, 'Ремонт');

  -- Материалы поставщика
  INSERT INTO public.services (company_id, title, description, price, category, material_group) VALUES
    (c_materials, 'Арматура A500C', 'Диаметры 10–18 мм, резка в размер', 420000, 'Материалы', 'Металлопрокат'),
    (c_materials, 'Бетон М300', 'Доставка миксером по Астане', 28000, 'Материалы', 'Бетон и растворы'),
    (c_materials, 'Газобетонный блок', 'D500, поддоны', 185000, 'Материалы', 'Кирпич и блоки');

  -- Завершённые заявки (в проде отзыв возможен только при status = completed и client_id = автор отзыва)
  INSERT INTO public.requests (client_id, company_id, title, description, status) VALUES
    (p_client, c_alatau, 'Коттедж в Алматы', 'Строительно-монтажные работы сданы', 'completed'),
    (p_clientco, c_alatau, 'Ремонт офиса', 'Договор закрыт, акт подписан', 'completed'),
    (p_sup_noco, c_alatau, 'Консультация по смете', 'Выезд и расчёт выполнены', 'completed'),
    (p_client, c_monolit, 'Фундамент склада', 'Монолит принят', 'completed'),
    (p_sup, c_monolit, 'Поставка и заливка', 'Партия бетона и работы по графику', 'completed'),
    (p_cont_noco, c_monolit, 'Подсобные работы на объекте', 'Бригадир подтвердил объём', 'completed'),
    (p_client, c_materials, 'Закупка арматуры', 'Накладные и оплата сверены', 'completed'),
    (p_clientco, c_materials, 'Цемент на объект', 'Доставка без расхождений', 'completed'),
    (p_cont1, c_materials, 'Металл на стройку', 'Комплектация в срок', 'completed'),
    (p_client, c_clientco, 'Мелкий ремонт помещения', 'Снили акт', 'completed'),
    (p_cont1, c_clientco, 'Доработки по договору', 'Гарантийный осмотр пройден', 'completed'),
    (p_sup, c_clientco, 'Материалы для ремонта', 'Поставка закрыта', 'completed');

  -- Отзывы: разные авторы, рейтинги и тексты (для витрины каталога)
  INSERT INTO public.reviews (company_id, author_id, rating, comment) VALUES
    (c_alatau, p_client, 5, 'Сроки выдержали, бригада на связи была каждый день. Рекомендую для генподряда.'),
    (c_alatau, p_clientco, 4, 'Качество хорошее, пара мелких правок — устранили за выходные.'),
    (c_alatau, p_sup_noco, 3, 'Смету разобрали подробно; ждал документ чуть дольше обещанного.'),
    (c_monolit, p_client, 4, 'Фундамент ровный, геодезия без замечаний. Пыль на объекте — нюанс.'),
    (c_monolit, p_sup, 5, 'Миксеры по графику, паспорта качества на месте. Отлично для снабжения.'),
    (c_monolit, p_cont_noco, 2, 'Небольшая задержка на полдня; в остальном нормально.'),
    (c_materials, p_client, 5, 'Арматура с маркировкой, вес сошёлся. Закажу ещё на следующий объект.'),
    (c_materials, p_clientco, 5, 'Цемент привезли окном в 2 часа, как договаривались.'),
    (c_materials, p_cont1, 4, 'Прекрасная партия; один поддон с вмятиной — заменили без споров.'),
    (c_clientco, p_client, 4, 'Ремонт аккуратный, смета почти не расползлась — это редкость.'),
    (c_clientco, p_cont1, 5, 'Доработки сделали быстро, документы в порядке.'),
    (c_clientco, p_sup, 3, 'Небольшая путаница в количестве мешков, в итоге нашли компромисс.');
END $$;

-- Города у любых тендеров без city
UPDATE public.tenders SET city = COALESCE(city, 'Алматы'), updated_at = now() WHERE city IS NULL;

-- Верификация всех компаний в БД (для демо-каталога; в проде не перезапускать вслепую)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'verification_status'
  ) THEN
    UPDATE public.companies SET verification_status = 'verified', is_verified = true;
  END IF;
END $$;

SELECT email AS "Логин (email)", '123456' AS "Пароль"
FROM auth.users WHERE email LIKE '%@test.com' ORDER BY email;
