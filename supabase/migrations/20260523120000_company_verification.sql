-- Верификация компаний: документы, статусы, роли moderator/admin

-- Роли
DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE 'moderator';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE 'admin';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TYPE public.company_verification_status AS ENUM (
  'draft',
  'pending',
  'verified',
  'rejected'
);

CREATE TYPE public.company_document_type AS ENUM (
  'registration',
  'representative_id',
  'power_of_attorney',
  'license',
  'product_certificate',
  'other'
);

-- Статус проверки компании
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS verification_status public.company_verification_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS verification_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_until timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Существующие проверенные компании
UPDATE public.companies
SET
  verification_status = 'verified',
  is_verified = true,
  verified_at = COALESCE(verified_at, created_at)
WHERE is_verified = true;

CREATE OR REPLACE FUNCTION public.sync_company_verification_flags()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_verified := (NEW.verification_status = 'verified');
  IF NEW.verification_status = 'verified' AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM 'verified') THEN
    NEW.verified_at := COALESCE(NEW.verified_at, now());
    NEW.rejection_reason := NULL;
  END IF;
  IF NEW.verification_status = 'rejected' THEN
    NEW.is_verified := false;
  END IF;
  IF NEW.verification_status = 'pending' AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM 'pending') THEN
    NEW.verification_submitted_at := COALESCE(NEW.verification_submitted_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_companies_verification_flags ON public.companies;
CREATE TRIGGER trg_companies_verification_flags
  BEFORE INSERT OR UPDATE OF verification_status, is_verified ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_company_verification_flags();

-- Сравнение через text: новые значения user_role нельзя использовать в той же транзакции, что ADD VALUE
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role::text IN ('moderator', 'admin')
  );
$$;

-- Документы компании (метаданные; файлы в storage)
CREATE TABLE IF NOT EXISTS public.company_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_type public.company_document_type NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS company_documents_company_id_idx ON public.company_documents(company_id);

-- История решений модератора
CREATE TABLE IF NOT EXISTS public.company_verification_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  moderator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('approved', 'rejected')),
  comment text,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS company_verification_reviews_company_idx
  ON public.company_verification_reviews(company_id, reviewed_at DESC);

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_verification_reviews ENABLE ROW LEVEL SECURITY;

-- company_documents RLS
DROP POLICY IF EXISTS "Company documents: owner or moderator read" ON public.company_documents;
CREATE POLICY "Company documents: owner or moderator read" ON public.company_documents
  FOR SELECT USING (
    public.is_moderator_or_admin()
    OR company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Company documents: owner insert" ON public.company_documents;
CREATE POLICY "Company documents: owner insert" ON public.company_documents
  FOR INSERT WITH CHECK (
    uploaded_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
      AND c.verification_status IN ('draft', 'rejected')
    )
  );

DROP POLICY IF EXISTS "Company documents: owner delete draft" ON public.company_documents;
CREATE POLICY "Company documents: owner delete draft" ON public.company_documents
  FOR DELETE USING (
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
      AND c.verification_status IN ('draft', 'rejected')
    )
  );

-- reviews: moderator insert, owner read own company reviews
DROP POLICY IF EXISTS "Company verification reviews: read" ON public.company_verification_reviews;
CREATE POLICY "Company verification reviews: read" ON public.company_verification_reviews
  FOR SELECT USING (
    public.is_moderator_or_admin()
    OR company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Company verification reviews: moderator insert" ON public.company_verification_reviews;
CREATE POLICY "Company verification reviews: moderator insert" ON public.company_verification_reviews
  FOR INSERT WITH CHECK (public.is_moderator_or_admin());

-- Владелец может отправить на проверку (draft/rejected -> pending)
DROP POLICY IF EXISTS "Companies: owner submit verification" ON public.companies;
CREATE POLICY "Companies: owner submit verification" ON public.companies
  FOR UPDATE USING (
    owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND verification_status IN ('draft', 'rejected')
  )
  WITH CHECK (
    owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND verification_status IN ('draft', 'rejected', 'pending')
  );

-- Модератор меняет статус верификации
DROP POLICY IF EXISTS "Companies: moderator verification update" ON public.companies;
CREATE POLICY "Companies: moderator verification update" ON public.companies
  FOR UPDATE USING (public.is_moderator_or_admin())
  WITH CHECK (public.is_moderator_or_admin());

-- Storage: приватный bucket для документов компании
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-documents', 'company-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Company docs storage: read" ON storage.objects;
CREATE POLICY "Company docs storage: read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'company-documents'
    AND (
      public.is_moderator_or_admin()
      OR (storage.foldername(name))[1] IN (
        SELECT c.id::text FROM public.companies c
        JOIN public.profiles p ON c.owner_id = p.id
        WHERE p.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Company docs storage: upload" ON storage.objects;
CREATE POLICY "Company docs storage: upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'company-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT c.id::text FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
      AND c.verification_status IN ('draft', 'rejected')
    )
  );

DROP POLICY IF EXISTS "Company docs storage: delete" ON storage.objects;
CREATE POLICY "Company docs storage: delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'company-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT c.id::text FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
      AND c.verification_status IN ('draft', 'rejected')
    )
  );

COMMENT ON COLUMN public.companies.verification_status IS 'draft | pending | verified | rejected';

-- Каталог: только verified; владелец и модератор видят свои/все статусы
DROP POLICY IF EXISTS "Companies: public read" ON public.companies;
CREATE POLICY "Companies: public read verified" ON public.companies
  FOR SELECT USING (
    verification_status = 'verified'
    OR owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR public.is_moderator_or_admin()
  );
