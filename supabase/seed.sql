-- УСТАРЕВШИЙ КОРОТКИЙ SEED — для полного набора тестов используйте:
--   supabase/seed_test_accounts.sql
--
-- Seed data for BuildConnect (Astana & Almaty)
-- Create 3 mock users: 1 client, 2 contractors

-- We insert users with proper identity records for email/password login
-- IMPORTANT: GoTrue expects all *_change and *_token columns to be '' not NULL
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data, created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, is_sso_user
) VALUES 
(
  'c8f33161-5ccf-4409-a1fc-224445582c01', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'client@test.com',
  crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Азамат Заказчиков", "role": "client"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
(
  'c8f33161-5ccf-4409-a1fc-224445582c02', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'contractor1@test.com',
  crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Берик Строителев", "role": "contractor"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
),
(
  'c8f33161-5ccf-4409-a1fc-224445582c03', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'contractor2@test.com',
  crypt('123456', gen_salt('bf')), now(),
  '{"full_name": "Данияр Монтажников", "role": "contractor"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now(), '', '', '', '', '', '', '', false
);

-- CRITICAL: auth.identities is required for email/password login in newer Supabase Auth
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at) VALUES
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c01', 'client@test.com', 'email', '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c01", "email": "client@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c02', 'contractor1@test.com', 'email', '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c02", "email": "contractor1@test.com"}', now(), now(), now()),
(gen_random_uuid(), 'c8f33161-5ccf-4409-a1fc-224445582c03', 'contractor2@test.com', 'email', '{"sub": "c8f33161-5ccf-4409-a1fc-224445582c03", "email": "contractor2@test.com"}', now(), now(), now());

-- Профили создаёт триггер on_auth_user_created (миграция 00004); дополняем телефон и город
UPDATE public.profiles SET phone = '+77011234567', city = 'Астана' WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c01';
UPDATE public.profiles SET phone = '+77022345678', city = 'Алматы' WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c02';
UPDATE public.profiles SET phone = '+77073456789', city = 'Астана' WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c03';

-- Wait a bit to ensure profiles are accessible to link as owners
DO $$
DECLARE
    client_profile uuid;
    cont1_profile uuid;
    cont2_profile uuid;
    comp1 uuid;
    comp2 uuid;
BEGIN
    SELECT id INTO client_profile FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c01';
    SELECT id INTO cont1_profile FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c02';
    SELECT id INTO cont2_profile FROM public.profiles WHERE user_id = 'c8f33161-5ccf-4409-a1fc-224445582c03';

    -- Create companies
    INSERT INTO public.companies (owner_id, name, category, city, description, is_verified, rating, review_count) VALUES
    (cont1_profile, 'Alatau Build LLP', 'Генеральный подряд', 'Алматы', 'Ведущая строительная компания южной столицы. Строим надежно и в срок.', true, 4.8, 12)
    RETURNING id INTO comp1;

    INSERT INTO public.companies (owner_id, name, category, city, description, is_verified, rating, review_count) VALUES
    (cont2_profile, 'Astana Monolit', 'Бетонные работы', 'Астана', 'Качественные монолитные работы любой сложности. Опыт более 10 лет.', true, 4.5, 5)
    RETURNING id INTO comp2;

    -- Tenders
    INSERT INTO public.tenders (client_id, title, description, budget, deadline, status, city, tender_type) VALUES
    (client_profile, 'Строительство коттеджа 200 кв.м', 'Необходимо построить двухэтажный дом с черновой отделкой', 45000000, '2024-08-01', 'open', 'Алматы', 'subcontract'),
    (client_profile, 'Капитальный ремонт офиса', 'Ремонт коммерческого помещения 150 кв.м "под ключ"', 15000000, '2024-05-15', 'open', 'Астана', 'subcontract'),
    (client_profile, 'Заливка фундамента', 'Ленточный фундамент под склад', 3000000, '2024-04-20', 'open', 'Шымкент', 'subcontract');

    -- Services
    INSERT INTO public.services (company_id, title, description, price, category) VALUES
    (comp1, 'Возведение стен из газоблока', 'Качественная кладка с соблюдением всех технологий', 8000, 'Кладка'),
    (comp1, 'Отделка фасада травертином', 'Монтаж натурального камня', 12000, 'Фасады'),
    (comp2, 'Заливка бетона М300', 'Свой бетонный узел, доставка миксером', 25000, 'Бетонные работы');

    -- Reviews
    INSERT INTO public.reviews (company_id, author_id, rating, comment) VALUES
    (comp1, client_profile, 5, 'Отличная компания! Сдали объект раньше срока. Рекомендую.');
END $$;
