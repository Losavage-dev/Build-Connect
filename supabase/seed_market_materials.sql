-- =============================================================================
-- BuildConnect: демо-материалы для модуля сравнения цен (фаза 1)
-- Запуск ПОСЛЕ seed_test_accounts.sql и миграции 20260609120000
-- Пароль новых аккаунтов: 123456
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Удаление предыдущего demo-seed (идемпотентность)
DELETE FROM auth.identities
WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'supplier-demo-%@test.com');

DELETE FROM auth.users WHERE email LIKE 'supplier-demo-%@test.com';

DELETE FROM public.services
WHERE company_id IN (
  SELECT id FROM public.companies WHERE name LIKE 'Demo Supply %'
);

DELETE FROM public.company_categories
WHERE company_id IN (SELECT id FROM public.companies WHERE name LIKE 'Demo Supply %');

DELETE FROM public.companies WHERE name LIKE 'Demo Supply %';

-- -----------------------------------------------------------------------------
-- Поставщики demo (5 городов)
-- -----------------------------------------------------------------------------
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data, created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, is_sso_user
) VALUES
(
  'd1000001-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'supplier-demo-almaty@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Demo Supply Almaty", "role": "supplier"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
(
  'd1000001-0000-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'supplier-demo-astana@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Demo Supply Astana", "role": "supplier"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
(
  'd1000001-0000-4000-8000-000000000003',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'supplier-demo-shymkent@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Demo Supply Shymkent", "role": "supplier"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
(
  'd1000001-0000-4000-8000-000000000004',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'supplier-demo-karaganda@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Demo Supply Karaganda", "role": "supplier"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
(
  'd1000001-0000-4000-8000-000000000005',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'supplier-demo-aktobe@test.com', crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Demo Supply Aktobe", "role": "supplier"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
);

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES
(gen_random_uuid(), 'd1000001-0000-4000-8000-000000000001', 'supplier-demo-almaty@test.com', 'email',
 '{"sub": "d1000001-0000-4000-8000-000000000001", "email": "supplier-demo-almaty@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'd1000001-0000-4000-8000-000000000002', 'supplier-demo-astana@test.com', 'email',
 '{"sub": "d1000001-0000-4000-8000-000000000002", "email": "supplier-demo-astana@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'd1000001-0000-4000-8000-000000000003', 'supplier-demo-shymkent@test.com', 'email',
 '{"sub": "d1000001-0000-4000-8000-000000000003", "email": "supplier-demo-shymkent@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'd1000001-0000-4000-8000-000000000004', 'supplier-demo-karaganda@test.com', 'email',
 '{"sub": "d1000001-0000-4000-8000-000000000004", "email": "supplier-demo-karaganda@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'd1000001-0000-4000-8000-000000000005', 'supplier-demo-aktobe@test.com', 'email',
 '{"sub": "d1000001-0000-4000-8000-000000000005", "email": "supplier-demo-aktobe@test.com"}', now(), now(), now());

UPDATE public.profiles SET
  first_name = 'Demo', last_name = 'Supply Almaty', phone = '+77022000001', city = 'Алматы', role = 'supplier'
WHERE user_id = 'd1000001-0000-4000-8000-000000000001';

UPDATE public.profiles SET
  first_name = 'Demo', last_name = 'Supply Astana', phone = '+77022000002', city = 'Астана', role = 'supplier'
WHERE user_id = 'd1000001-0000-4000-8000-000000000002';

UPDATE public.profiles SET
  first_name = 'Demo', last_name = 'Supply Shymkent', phone = '+77022000003', city = 'Шымкент', role = 'supplier'
WHERE user_id = 'd1000001-0000-4000-8000-000000000003';

UPDATE public.profiles SET
  first_name = 'Demo', last_name = 'Supply Karaganda', phone = '+77022000004', city = 'Караганда', role = 'supplier'
WHERE user_id = 'd1000001-0000-4000-8000-000000000004';

UPDATE public.profiles SET
  first_name = 'Demo', last_name = 'Supply Aktobe', phone = '+77022000005', city = 'Актobe', role = 'supplier'
WHERE user_id = 'd1000001-0000-4000-8000-000000000005';

-- -----------------------------------------------------------------------------
-- Компании + объявления материалов
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  p_almaty uuid;
  p_astana uuid;
  p_shymkent uuid;
  p_karaganda uuid;
  p_aktobe uuid;
  p_sup uuid;
  c_id uuid;
  pid uuid;
  base numeric;
  i integer;
  cities text[] := ARRAY['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актobe'];
  profiles uuid[] := ARRAY[
    NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid
  ];
  product_rec RECORD;
BEGIN
  SELECT id INTO p_almaty FROM public.profiles WHERE user_id = 'd1000001-0000-4000-8000-000000000001';
  SELECT id INTO p_astana FROM public.profiles WHERE user_id = 'd1000001-0000-4000-8000-000000000002';
  SELECT id INTO p_shymkent FROM public.profiles WHERE user_id = 'd1000001-0000-4000-8000-000000000003';
  SELECT id INTO p_karaganda FROM public.profiles WHERE user_id = 'd1000001-0000-4000-8000-000000000004';
  SELECT id INTO p_aktobe FROM public.profiles WHERE user_id = 'd1000001-0000-4000-8000-000000000005';
  SELECT id INTO p_sup FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c04';

  profiles := ARRAY[p_almaty, p_astana, p_shymkent, p_karaganda, p_aktobe];

  FOR i IN 1..5 LOOP
    INSERT INTO public.companies (owner_id, name, category, city, description, is_verified, verification_status, rating, review_count)
    VALUES (
      profiles[i],
      'Demo Supply ' || cities[i],
      'Материалы',
      cities[i],
      'Демо-поставщик для сравнения цен на BuildConnect.',
      true,
      'verified',
      0,
      0
    )
    RETURNING id INTO c_id;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_categories') THEN
      INSERT INTO public.company_categories (company_id, category) VALUES (c_id, 'Материалы');
    END IF;
  END LOOP;

  -- Вторая компания в Алматы (больше объявлений в одном городе)
  INSERT INTO public.companies (owner_id, name, category, city, description, is_verified, verification_status, rating, review_count)
  VALUES (
    p_almaty, 'Demo Supply Almaty 2', 'Материалы', 'Алматы',
    'Второй демо-склад в Алматы.', true, 'verified', 0, 0
  )
  RETURNING id INTO c_id;

  -- Steppe Materials — доп. позиции в Астане
  SELECT id INTO c_id FROM public.companies WHERE name = 'Steppe Materials' LIMIT 1;
  IF c_id IS NOT NULL THEN
    FOR product_rec IN
      SELECT id, slug, name, material_group, price_unit
      FROM public.market_products
      WHERE slug IN ('sendvich-panel-100', 'profnastil-krovelnyy', 'mineralnaya-vata', 'cement-m500')
    LOOP
      base := CASE product_rec.slug
        WHEN 'sendvich-panel-100' THEN 4100
        WHEN 'profnastil-krovelnyy' THEN 3200
        WHEN 'mineralnaya-vata' THEN 1800
        WHEN 'cement-m500' THEN 54000
        ELSE 10000
      END;
      FOR j IN 1..4 LOOP
        INSERT INTO public.services (company_id, title, description, price, category, material_group, market_product_id, price_unit)
        VALUES (
          c_id, product_rec.name, 'Поставка со склада, Астана',
          ROUND((base * (0.92 + random() * 0.16))::numeric, 0),
          'Материалы', product_rec.material_group, product_rec.id, product_rec.price_unit
        );
      END LOOP;
    END LOOP;
  END IF;

  -- Объявления по ключевым SKU в каждом городе (6–8 на SKU)
  FOR product_rec IN
    SELECT id, slug, name, material_group, price_unit FROM public.market_products
    WHERE slug IN (
      'sendvich-panel-100', 'sendvich-panel-80', 'armatura-a500c', 'beton-m300',
      'cement-m400', 'gazobeton-d500', 'profnastil-krovelnyy', 'mineralnaya-vata',
      'gipsokarton', 'pesok-stroitelnyy', 'scheben-5-20', 'plitka-keramicheskaya'
    )
  LOOP
    base := CASE product_rec.slug
      WHEN 'sendvich-panel-100' THEN 4000
      WHEN 'sendvich-panel-80' THEN 3600
      WHEN 'armatura-a500c' THEN 420000
      WHEN 'beton-m300' THEN 28000
      WHEN 'cement-m400' THEN 52000
      WHEN 'gazobeton-d500' THEN 195000
      WHEN 'profnastil-krovelnyy' THEN 3100
      WHEN 'mineralnaya-vata' THEN 1750
      WHEN 'gipsokarton' THEN 2200
      WHEN 'pesok-stroitelnyy' THEN 8500
      WHEN 'scheben-5-20' THEN 12000
      WHEN 'plitka-keramicheskaya' THEN 4500
      ELSE 10000
    END;

    FOR i IN 1..5 LOOP
      SELECT c.id INTO c_id
      FROM public.companies c
      WHERE c.name = 'Demo Supply ' || cities[i]
      LIMIT 1;

      -- Минимум 6 объявлений на пару «город + SKU» (insights при listing_count >= 5)
      FOR j IN 1..6 LOOP
        INSERT INTO public.services (company_id, title, description, price, category, material_group, market_product_id, price_unit)
        VALUES (
          c_id,
          product_rec.name,
          'Опт, доставка по ' || cities[i],
          ROUND((base * (0.88 + random() * 0.24))::numeric, 0),
          'Материалы',
          product_rec.material_group,
          product_rec.id,
          product_rec.price_unit
        );
      END LOOP;

      -- Алматы: доп. объявления со второго склада
      IF cities[i] = 'Алматы' THEN
        SELECT c.id INTO c_id FROM public.companies c WHERE c.name = 'Demo Supply Almaty 2' LIMIT 1;
        IF c_id IS NOT NULL THEN
          FOR j IN 1..3 LOOP
            INSERT INTO public.services (company_id, title, description, price, category, material_group, market_product_id, price_unit)
            VALUES (
              c_id, product_rec.name, 'Склад №2, Алматы',
              ROUND((base * (0.9 + random() * 0.2))::numeric, 0),
              'Материалы', product_rec.material_group, product_rec.id, product_rec.price_unit
            );
          END LOOP;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  -- Привязка существующих тестовых материалов Steppe
  UPDATE public.services s SET
    market_product_id = mp.id,
    price_unit = mp.price_unit
  FROM public.market_products mp
  WHERE s.category = 'Материалы'
    AND s.title = mp.name
    AND s.market_product_id IS NULL;
END $$;

SELECT public.recompute_platform_price_aggregates();

SELECT COUNT(*) AS material_listings FROM public.services WHERE category = 'Материалы' AND market_product_id IS NOT NULL;
SELECT COUNT(*) AS price_insights FROM public.listing_price_insights;
SELECT COUNT(*) AS aggregates FROM public.platform_price_aggregates;

-- Топ групп с достаточным числом объявлений (должно быть listing_count >= 5)
SELECT a.city, mp.name, a.listing_count, a.median_price
FROM public.platform_price_aggregates a
JOIN public.market_products mp ON mp.id = a.market_product_id
WHERE a.listing_count >= 5
ORDER BY a.listing_count DESC
LIMIT 15;
