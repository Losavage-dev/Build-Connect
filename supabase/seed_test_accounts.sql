-- =============================================================================
-- BuildConnect: тестовые аккаунты для проверки ролей и сценариев
-- Запуск: Supabase Dashboard → SQL Editor → вставить весь файл → Run
-- Затем: seed_rich_demo_data.sql (расширенный каталог, медиана цен, витрина Steppe)
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
-- 6. Заказчик с компанией (сценарий «Мои компании» у client)
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
),
-- 9. Подрядчик Тараз (рекомендации по городу)
(
  'c8f33161-5ccf-4409-a1fc-224445582c09',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'contractor3@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Ерлан Таразов", "role": "contractor"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
-- 10. Подрядчик Шымкент (фасады / отделка)
(
  'c8f33161-5ccf-4409-a1fc-224445582c0a',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'contractor4@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Асель Шымкентова", "role": "contractor"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
-- 11. Заказчик Тараз
(
  'c8f33161-5ccf-4409-a1fc-224445582c0b',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'client-taraz@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Гульнара Таразова", "role": "client"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
-- 12. Поставщик №2 (Алматы)
(
  'c8f33161-5ccf-4409-a1fc-224445582c0c',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'supplier2@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Канат Снабженцев", "role": "supplier"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
-- 13. Подрядчик кровля (Астана)
(
  'c8f33161-5ccf-4409-a1fc-224445582c0d',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'contractor-roof@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Серик Кровлев", "role": "contractor"}',
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
 '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c08", "email": "moderator@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c09', 'contractor3@test.com', 'email',
 '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c09", "email": "contractor3@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c0a', 'contractor4@test.com', 'email',
 '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c0a", "email": "contractor4@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c0b', 'client-taraz@test.com', 'email',
 '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c0b", "email": "client-taraz@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c0c', 'supplier2@test.com', 'email',
 '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c0c", "email": "supplier2@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c0d', 'contractor-roof@test.com', 'email',
 '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c0d", "email": "contractor-roof@test.com"}', now(), now(), now());

-- Профили (триггер уже создал строки; дополняем контакты)
UPDATE public.profiles SET
  first_name = 'Азамат', last_name = 'Сейлханов', phone = '+77011111101', city = 'Астана', role = 'client'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c01';

UPDATE public.profiles SET
  first_name = 'Берик', last_name = 'Оразов', phone = '+77011111102', city = 'Алматы', role = 'contractor'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c02';

UPDATE public.profiles SET
  first_name = 'Данияр', last_name = 'Нуржанов', phone = '+77011111103', city = 'Астана', role = 'contractor'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c03';

UPDATE public.profiles SET
  first_name = 'Мадина', last_name = 'Касымова', phone = '+77011111104', city = 'Астана', role = 'supplier'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c04';

UPDATE public.profiles SET
  first_name = 'Серик', last_name = 'Жумабеков', phone = '+77011111105', city = 'Шымкент', role = 'supplier'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c05';

UPDATE public.profiles SET
  first_name = 'Айгуль', last_name = 'Бекенова', phone = '+77011111106', city = 'Астана', role = 'client'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c06';

UPDATE public.profiles SET
  first_name = 'Нурлан', last_name = 'Ахметов', phone = '+77011111107', city = 'Алматы', role = 'contractor'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c07';

UPDATE public.profiles SET
  first_name = 'Алия', last_name = 'Мусаева', phone = '+77011111108', city = 'Астана', role = 'moderator'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c08';

UPDATE public.profiles SET
  first_name = 'Ерлан', last_name = 'Тарасов', phone = '+77011111109', city = 'Тараз', role = 'contractor'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c09';

UPDATE public.profiles SET
  first_name = 'Асель', last_name = 'Рахимова', phone = '+77011111110', city = 'Шымкент', role = 'contractor'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c0a';

UPDATE public.profiles SET
  first_name = 'Гульнара', last_name = 'Тлеубергенова', phone = '+77011111111', city = 'Тараз', role = 'client'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c0b';

UPDATE public.profiles SET
  first_name = 'Канат', last_name = 'Елеуов', phone = '+77011111112', city = 'Алматы', role = 'supplier'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c0c';

UPDATE public.profiles SET
  first_name = 'Серик', last_name = 'Кошкарбаев', phone = '+77011111113', city = 'Астана', role = 'contractor'
WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c0d';

-- Полные профили: фиксация ФИО/телефона (как после CompleteProfile)
UPDATE public.profiles
SET identity_locked_at = COALESCE(identity_locked_at, now())
WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@test.com')
  AND trim(coalesce(first_name, '')) <> ''
  AND trim(coalesce(last_name, '')) <> ''
  AND trim(coalesce(phone, '')) <> ''
  AND trim(coalesce(city, '')) <> '';

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
  proj_id uuid;
BEGIN
  SELECT id INTO p_client FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c01';
  SELECT id INTO p_cont1 FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c02';
  SELECT id INTO p_cont2 FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c03';
  SELECT id INTO p_sup FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c04';
  SELECT id INTO p_sup_noco FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c05';
  SELECT id INTO p_clientco FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c06';
  SELECT id INTO p_cont_noco FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c07';

  INSERT INTO public.companies (owner_id, name, category, city, description, phone, email, address, logo_url, is_verified, verification_status, rating, review_count, bin)
  VALUES (
    p_cont1, 'ТОО «Alatau Build»', 'Генеральный подряд', 'Алматы',
    'Генеральный подряд, коттеджное и коммерческое строительство. Работаем по Алматы и области с 2014 года. Собственная техника и проектный отдел.',
    '+77272700101', 'office@alatau-build.kz', 'пр. Абая 150/230, офис 412',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=256&h=256&fit=crop',
    true, 'verified', 0, 0, '101240012345'
  )
  RETURNING id INTO c_alatau;

  INSERT INTO public.companies (owner_id, name, category, city, description, phone, email, address, logo_url, is_verified, verification_status, rating, review_count, bin)
  VALUES (
    p_cont2, 'ТОО «Astana Monolit»', 'Бетонные работы', 'Астана',
    'Монолитные работы, бетонные смеси, фундаменты и перекрытия. Собственный БМЗ, сертификаты качества на каждую поставку.',
    '+77172700202', 'info@astana-monolit.kz', 'ул. Кенесары 45, база',
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=256&h=256&fit=crop',
    true, 'verified', 0, 0, '101240023456'
  )
  RETURNING id INTO c_monolit;

  INSERT INTO public.companies (owner_id, name, category, city, description, phone, email, address, website, logo_url, is_verified, verification_status, rating, review_count, bin)
  VALUES (
    p_sup, 'ТОО «Steppe Materials»', 'Материалы', 'Астана',
    'Оптовый склад стройматериалов: металл, бетон, блоки, кровля, изоляция. Доставка по Астане и области, резка и комплектация объектов.',
    '+77172700303', 'sales@steppe-materials.kz', 'пр. Туран 55, склад №2', 'https://steppe-materials.kz',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=256&h=256&fit=crop',
    true, 'verified', 0, 0, '101240034567'
  )
  RETURNING id INTO c_materials;

  INSERT INTO public.companies (owner_id, name, category, city, description, phone, email, address, logo_url, is_verified, verification_status, rating, review_count, bin)
  VALUES (
    p_clientco, 'ТОО «ZakazTech»', 'Ремонт', 'Астана',
    'Ремонт офисов и коммерческих помещений под ключ. Работаем с корпоративными заказчиками, фиксированная смета.',
    '+77172700404', 'hello@zakaztech.kz', 'ул. Сыганак 25, офис 8',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=256&h=256&fit=crop',
    true, 'verified', 0, 0, '101240045678'
  )
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
    (p_client, 'Строительство коттеджа 200 м² в Алматы', 'Двухэтажный дом, газоблок, мягкая кровля. Нужен подрядчик с опытом ИЖС.', 45000000, '2026-09-01', 'open', 'Алматы', 'subcontract'),
    (p_client, 'Капитальный ремонт офиса 150 м²', 'Астана, Esil district: демонтаж, электрика, чистовая отделка.', 15000000, '2026-06-15', 'open', 'Астана', 'subcontract'),
    (p_client, 'Заливка ленточного фундамента под склад', 'Шымкент, индустриальная зона. Бетон М300, ~85 м³.', 3000000, '2026-05-20', 'open', 'Шымкент', 'subcontract'),
    (p_client, 'Фасад торгового центра — этап 2', 'Утепление и облицовка, исполнитель выбран, контроль качества.', 22000000, '2026-04-01', 'in_progress', 'Алматы', 'subcontract'),
    (p_client, 'Демонтаж неиспользуемого склада', 'Тендер закрыт — объект передан другому подрядчику.', 800000, '2025-12-01', 'closed', 'Астана', 'subcontract');

  -- Тендер поставщика без компании (отклики → в профиль)
  INSERT INTO public.tenders (client_id, title, description, budget, deadline, status, city, tender_type) VALUES
    (p_sup_noco, 'Доставка цемента М400 на объект', '30 тонн, разгрузка манипулятором, Астана.', 450000, '2026-05-25', 'open', 'Астана', 'logistics');

  -- Тендер поставщика с компанией
  INSERT INTO public.tenders (client_id, title, description, budget, deadline, status, city, tender_type) VALUES
    (p_sup, 'Бригада на разгрузку и складирование', 'Склад Steppe Materials, смена 2–3 дня.', 350000, '2026-05-30', 'open', 'Астана', 'subcontract');

  -- Услуги подрядчиков (базовая витрина; расширение — seed_rich_demo_data.sql)
  INSERT INTO public.services (company_id, title, description, price, category) VALUES
    (c_alatau, 'Возведение стен из газоблока', 'Кладка D500, перевязка, armopoyas', 8500, 'Кладка'),
    (c_alatau, 'Отделка фасада травертином', 'Натуральный камень, кляммерная система', 12500, 'Фасадные работы'),
    (c_alatau, 'Монтаж кровли из металлочерепицы', 'Под ключ с утеплением', 7200, 'Кровельные работы'),
    (c_monolit, 'Заливка бетона М300', 'Собственный БМЗ, насос, виброуплотнение', 26500, 'Бетонные работы'),
    (c_monolit, 'Армирование монолитной плиты', 'Вязка каркаса по проекту', 4800, 'Бетонные работы'),
    (c_clientco, 'Косметический ремонт офиса', 'Покраска, замена напольного покрытия', 1550000, 'Ремонт');

  -- Материалы поставщика (расширяются в seed_rich_demo_data.sql)
  INSERT INTO public.services (company_id, title, description, price, category, material_group) VALUES
    (c_materials, 'Арматура A500C', '10–18 мм, сертификат, резка в размер', 425000, 'Материалы', 'Металлопрокат'),
    (c_materials, 'Бетон М300', 'Доставка миксером по Астане, мин. 7 м³', 28500, 'Материалы', 'Бетон и растворы'),
    (c_materials, 'Газобетонный блок D500', 'Поддон 1.8 м³, разгрузка', 188000, 'Материалы', 'Кирпич и блоки');

  -- Портфолио тестовых компаний (1–5 проектов + фото Unsplash)
  INSERT INTO public.projects (company_id, title, description, completion_date, project_phase, start_date)
  VALUES (c_alatau, 'Коттедж 220 м², Медeu', 'Генподряд: фундамент, коробка, кровля, фасад', '2024', 'completed', '2023-04-01')
  RETURNING id INTO proj_id;
  INSERT INTO public.project_images (project_id, image_url, caption, image_role, sort_order) VALUES
    (proj_id, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', 'Фасад после сдачи', 'site_end', 0),
    (proj_id, 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop', 'Монтаж конструкций', 'work_in_progress', 1);

  INSERT INTO public.projects (company_id, title, description, completion_date, project_phase, start_date)
  VALUES (c_alatau, 'ЖК «Alatau Residence» — коробка', 'Монолит, кладка, кровля на 2 секции', '2023', 'completed', '2022-06-01')
  RETURNING id INTO proj_id;
  INSERT INTO public.project_images (project_id, image_url, caption, image_role, sort_order) VALUES
    (proj_id, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop', 'Общий вид секций', 'gallery', 0);

  INSERT INTO public.projects (company_id, title, description, completion_date, project_phase, start_date)
  VALUES (c_alatau, 'Офисный блок 1200 м²', 'Реконструкция и отделка open space', '2025', 'completed', '2024-09-01')
  RETURNING id INTO proj_id;
  INSERT INTO public.project_images (project_id, image_url, caption, image_role, sort_order) VALUES
    (proj_id, 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop', 'Интерьер после сдачи', 'site_end', 0);

  INSERT INTO public.projects (company_id, title, description, completion_date, project_phase, start_date)
  VALUES (c_alatau, 'Кровля ТЦ «Алма»', 'Металлочерепица, утепление 150 мм', '2026', 'in_progress', '2025-11-01')
  RETURNING id INTO proj_id;
  INSERT INTO public.project_images (project_id, image_url, caption, image_role, sort_order) VALUES
    (proj_id, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop', 'Монтаж стропил', 'work_in_progress', 0);

  INSERT INTO public.projects (company_id, title, description, completion_date, project_phase, start_date)
  VALUES (c_monolit, 'Фундамент логистического центра', 'Ленточный фундамент, 240 м³ бетона М350', '2024', 'completed', '2024-03-01')
  RETURNING id INTO proj_id;
  INSERT INTO public.project_images (project_id, image_url, caption, image_role, sort_order) VALUES
    (proj_id, 'https://images.unsplash.com/photo-1590496793907-607806659bee?w=800&h=600&fit=crop', 'Заливка бетона', 'gallery', 0);

  INSERT INTO public.projects (company_id, title, description, completion_date, project_phase, start_date)
  VALUES (c_monolit, 'Монолитное перекрытие БЦ Esil', 'Плита 1800 м², двухслойное армирование', '2025', 'completed', '2024-11-01')
  RETURNING id INTO proj_id;
  INSERT INTO public.project_images (project_id, image_url, caption, image_role, sort_order) VALUES
    (proj_id, 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop', 'Армирование плиты', 'work_in_progress', 0);

  INSERT INTO public.projects (company_id, title, description, completion_date, project_phase, start_date)
  VALUES (c_monolit, 'БМЗ — поставка М300 на ЖК', '1200 м³ за 45 дней, насос 42 м', '2023', 'completed', '2023-07-01')
  RETURNING id INTO proj_id;
  INSERT INTO public.project_images (project_id, image_url, caption, image_role, sort_order) VALUES
    (proj_id, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop', 'Подача бетона', 'gallery', 0);

  INSERT INTO public.projects (company_id, title, description, completion_date, project_phase, start_date)
  VALUES (c_materials, 'Комплектация ЖК Esil', 'Арматура, блок, кровля — 18 рейсов', '2025', 'completed', '2025-01-15')
  RETURNING id INTO proj_id;
  INSERT INTO public.project_images (project_id, image_url, caption, image_role, sort_order) VALUES
    (proj_id, 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop', 'Отгрузка со склада', 'gallery', 0);

  INSERT INTO public.projects (company_id, title, description, completion_date, project_phase, start_date)
  VALUES (c_materials, 'Поставка кровли на ангар 1480 м²', 'Профнастил, утеплитель, доставка манипулятором', '2024', 'completed', '2024-05-01')
  RETURNING id INTO proj_id;
  INSERT INTO public.project_images (project_id, image_url, caption, image_role, sort_order) VALUES
    (proj_id, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop', 'Разгрузка на объекте', 'site_end', 0);

  INSERT INTO public.projects (company_id, title, description, completion_date, project_phase, start_date)
  VALUES (c_clientco, 'Ремонт офиса IT-компании 420 м²', 'Open space, переговорные, акустика', '2024', 'completed', '2024-02-01')
  RETURNING id INTO proj_id;
  INSERT INTO public.project_images (project_id, image_url, caption, image_role, sort_order) VALUES
    (proj_id, 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop', 'Готовый офис', 'site_end', 0);

  INSERT INTO public.projects (company_id, title, description, completion_date, project_phase, start_date)
  VALUES (c_clientco, 'Отделка ресторана 180 м²', 'Чистовая отделка, освещение, вентиляция', '2025', 'completed', '2024-10-01')
  RETURNING id INTO proj_id;
  INSERT INTO public.project_images (project_id, image_url, caption, image_role, sort_order) VALUES
    (proj_id, 'https://images.unsplash.com/photo-1600607687939-ce8a6a251eca?w=800&h=600&fit=crop', 'Зал после сдачи', 'gallery', 0);

  INSERT INTO public.projects (company_id, title, description, completion_date, project_phase, start_date)
  VALUES (c_clientco, 'Косметический ремонт банковского отделения', 'Покраска, замена пола, ресепшн', '2023', 'completed', '2023-08-01')
  RETURNING id INTO proj_id;
  INSERT INTO public.project_images (project_id, image_url, caption, image_role, sort_order) VALUES
    (proj_id, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', 'Клиентская зона', 'gallery', 0);

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

  -- Первое сообщение в чате — как buildFirstChatMessage (текст + блок «Источник»)
  INSERT INTO public.messages (request_id, sender_id, content, is_read)
  SELECT
    r.id,
    r.client_id,
    trim(coalesce(nullif(trim(r.description), ''), trim(r.title)))
      || E'\n\n⟦buildconnect:context⟧\n'
      || 'Источник: Каталог: «' || c.name || '»',
    true
  FROM public.requests r
  INNER JOIN public.companies c ON c.id = r.company_id
  WHERE r.company_id IN (c_alatau, c_monolit, c_materials, c_clientco)
    AND r.status = 'completed'
    AND NOT EXISTS (SELECT 1 FROM public.messages m WHERE m.request_id = r.id);

  -- Завершённые demo-заявки не должны светиться как «новые» в колокольчике
  UPDATE public.notifications n
  SET read_at = now()
  FROM public.requests r
  WHERE n.request_id = r.id
    AND r.company_id IN (c_alatau, c_monolit, c_materials, c_clientco)
    AND r.status = 'completed'
    AND n.read_at IS NULL;

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

-- -----------------------------------------------------------------------------
-- Починка уже существующих завершённых demo-заявок (можно запускать отдельно на prod)
-- -----------------------------------------------------------------------------
INSERT INTO public.messages (request_id, sender_id, content, is_read)
SELECT
  r.id,
  r.client_id,
  trim(coalesce(nullif(trim(r.description), ''), trim(r.title)))
    || E'\n\n⟦buildconnect:context⟧\n'
    || 'Источник: Каталог: «' || c.name || '»',
  true
FROM public.requests r
INNER JOIN public.companies c ON c.id = r.company_id
WHERE r.status = 'completed'
  AND c.name IN ('ТОО «Alatau Build»', 'ТОО «Astana Monolit»', 'ТОО «Steppe Materials»', 'ТОО «ZakazTech»',
    'Alatau Build LLP', 'Astana Monolit', 'Steppe Materials', 'ZakazTech LLP')
  AND NOT EXISTS (SELECT 1 FROM public.messages m WHERE m.request_id = r.id);

-- Привести старые demo-сообщения к формату UI (если патч уже запускали раньше)
UPDATE public.messages m
SET content =
  trim(coalesce(nullif(trim(r.description), ''), trim(r.title)))
  || E'\n\n⟦buildconnect:context⟧\n'
  || 'Источник: Каталог: «' || c.name || '»'
FROM public.requests r
INNER JOIN public.companies c ON c.id = r.company_id
WHERE m.request_id = r.id
  AND m.sender_id = r.client_id
  AND r.status = 'completed'
  AND c.name IN ('ТОО «Alatau Build»', 'ТОО «Astana Monolit»', 'ТОО «Steppe Materials»', 'ТОО «ZakazTech»',
    'Alatau Build LLP', 'Astana Monolit', 'Steppe Materials', 'ZakazTech LLP')
  AND m.content NOT LIKE '%⟦buildconnect:context⟧%'
  AND m.id = (
    SELECT m2.id FROM public.messages m2
    WHERE m2.request_id = r.id
    ORDER BY m2.created_at ASC
    LIMIT 1
  );

UPDATE public.notifications n
SET read_at = now()
FROM public.requests r
INNER JOIN public.companies c ON c.id = r.company_id
WHERE n.request_id = r.id
  AND r.status = 'completed'
  AND c.name IN ('ТОО «Alatau Build»', 'ТОО «Astana Monolit»', 'ТОО «Steppe Materials»', 'ТОО «ZakazTech»',
    'Alatau Build LLP', 'Astana Monolit', 'Steppe Materials', 'ZakazTech LLP')
  AND n.read_at IS NULL;

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
