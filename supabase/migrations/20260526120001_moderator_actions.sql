-- Действия модератора: скрытие компании, закрытие тендера, журнал (после enum suspended)

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
  IF NEW.verification_status::text IN ('rejected', 'suspended') THEN
    NEW.is_verified := false;
  END IF;
  IF NEW.verification_status = 'pending' AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM 'pending') THEN
    NEW.verification_submitted_at := COALESCE(NEW.verification_submitted_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Companies: owner submit verification" ON public.companies;
CREATE POLICY "Companies: owner submit verification" ON public.companies
  FOR UPDATE USING (
    owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND verification_status::text IN ('draft', 'rejected', 'suspended')
  )
  WITH CHECK (
    owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND verification_status::text IN ('draft', 'rejected', 'suspended', 'pending')
  );

DROP POLICY IF EXISTS "Company documents: owner insert" ON public.company_documents;
CREATE POLICY "Company documents: owner insert" ON public.company_documents
  FOR INSERT WITH CHECK (
    uploaded_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
      AND c.verification_status::text IN ('draft', 'rejected', 'suspended')
    )
  );

DROP POLICY IF EXISTS "Company documents: owner delete draft" ON public.company_documents;
CREATE POLICY "Company documents: owner delete draft" ON public.company_documents
  FOR DELETE USING (
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
      AND c.verification_status::text IN ('draft', 'rejected', 'suspended')
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
      AND c.verification_status::text IN ('draft', 'rejected', 'suspended')
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
      AND c.verification_status::text IN ('draft', 'rejected', 'suspended')
    )
  );

DROP POLICY IF EXISTS "Tenders: moderator update" ON public.tenders;
CREATE POLICY "Tenders: moderator update" ON public.tenders
  FOR UPDATE USING (public.is_moderator_or_admin())
  WITH CHECK (public.is_moderator_or_admin());

CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN (
    'company_suspend',
    'company_restore',
    'tender_close'
  )),
  target_type text NOT NULL CHECK (target_type IN ('company', 'tender')),
  target_id uuid NOT NULL,
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moderation_actions_target_idx
  ON public.moderation_actions (target_type, target_id, created_at DESC);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Moderation actions: staff read" ON public.moderation_actions;
CREATE POLICY "Moderation actions: staff read" ON public.moderation_actions
  FOR SELECT USING (public.is_moderator_or_admin());

DROP POLICY IF EXISTS "Moderation actions: staff insert" ON public.moderation_actions;
CREATE POLICY "Moderation actions: staff insert" ON public.moderation_actions
  FOR INSERT WITH CHECK (
    public.is_moderator_or_admin()
    AND moderator_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

GRANT SELECT, INSERT ON public.moderation_actions TO authenticated;

ALTER TABLE public.company_verification_reviews
  DROP CONSTRAINT IF EXISTS company_verification_reviews_decision_check;

ALTER TABLE public.company_verification_reviews
  ADD CONSTRAINT company_verification_reviews_decision_check
  CHECK (decision IN ('approved', 'rejected', 'suspended', 'restored'));
