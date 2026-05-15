DO $$ BEGIN
  ALTER TYPE public.company_verification_status ADD VALUE 'revoked';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
