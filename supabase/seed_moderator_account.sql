-- =============================================================================
-- Только модератор (не удаляет другие @test.com аккаунты)
-- Supabase Dashboard → SQL Editor → Run
-- Логин: moderator@test.com   Пароль: 123456
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  mod_id uuid := 'c8f33161-5ccf-4409-a1fc-224445582c08';
BEGIN
  DELETE FROM auth.identities WHERE user_id = mod_id;
  DELETE FROM auth.identities WHERE provider_id = 'moderator@test.com' AND provider = 'email';
  DELETE FROM public.profiles WHERE user_id = mod_id;
  DELETE FROM auth.users WHERE email = 'moderator@test.com';

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data, created_at, updated_at,
    confirmation_token, recovery_token,
    email_change, email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, is_sso_user
  ) VALUES (
    mod_id,
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'moderator@test.com', crypt('123456', gen_salt('bf')), now(),
    '{"full_name": "Алия Модераторова", "role": "moderator"}',
    '{"provider": "email", "providers": ["email"]}',
    now(), now(), '', '', '', '', '', '', '', false
  );

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), mod_id, 'moderator@test.com', 'email',
    jsonb_build_object('sub', mod_id::text, 'email', 'moderator@test.com'),
    now(), now(), now()
  );

  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = mod_id) THEN
    UPDATE public.profiles SET
      first_name = 'Алия',
      last_name = 'Модераторова',
      phone = '+77011111108',
      city = 'Астана',
      role = 'moderator'
    WHERE user_id = mod_id;
  ELSE
    INSERT INTO public.profiles (user_id, first_name, last_name, phone, city, role)
    VALUES (mod_id, 'Алия', 'Модераторова', '+77011111108', 'Астана', 'moderator');
  END IF;
END $$;

SELECT email AS login, '123456' AS password, 'moderator' AS role
FROM auth.users WHERE email = 'moderator@test.com';
