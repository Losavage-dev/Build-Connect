-- Новый статус: компания скрыта модератором (отдельная миграция — enum в той же транзакции нельзя использовать в RLS)
DO $$ BEGIN
  ALTER TYPE public.company_verification_status ADD VALUE 'suspended';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
