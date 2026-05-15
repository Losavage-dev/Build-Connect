-- Журнал жалоб, уведомления, бан, расширение действий модератора

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
  IF NEW.verification_status::text IN ('rejected', 'suspended', 'revoked') THEN
    NEW.is_verified := false;
  END IF;
  IF NEW.verification_status = 'pending' AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM 'pending') THEN
    NEW.verification_submitted_at := COALESCE(NEW.verification_submitted_at, now());
  END IF;
  RETURN NEW;
END;
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned_until timestamptz,
  ADD COLUMN IF NOT EXISTS ban_reason text;

-- События по жалобе (лента в карточке жалобы)
CREATE TABLE IF NOT EXISTS public.report_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  summary text NOT NULL,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_events_report_id_idx
  ON public.report_events (report_id, created_at ASC);

ALTER TABLE public.report_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Report events: staff read" ON public.report_events;
CREATE POLICY "Report events: staff read" ON public.report_events
  FOR SELECT USING (public.is_moderator_or_admin());

DROP POLICY IF EXISTS "Report events: staff insert" ON public.report_events;
CREATE POLICY "Report events: staff insert" ON public.report_events
  FOR INSERT WITH CHECK (public.is_moderator_or_admin());

DROP POLICY IF EXISTS "Report events: reporter read own" ON public.report_events;
CREATE POLICY "Report events: reporter read own" ON public.report_events
  FOR SELECT USING (
    report_id IN (
      SELECT r.id FROM public.reports r
      WHERE r.reporter_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

GRANT SELECT, INSERT ON public.report_events TO authenticated;

-- Уведомления модерации (таблица notifications уже есть — recipient_id, type)
DROP POLICY IF EXISTS "Notifications: staff insert moderation" ON public.notifications;
CREATE POLICY "Notifications: staff insert moderation" ON public.notifications
  FOR INSERT WITH CHECK (public.is_moderator_or_admin());

-- Расширение типов действий
ALTER TABLE public.moderation_actions DROP CONSTRAINT IF EXISTS moderation_actions_action_type_check;
ALTER TABLE public.moderation_actions DROP CONSTRAINT IF EXISTS moderation_actions_target_type_check;
ALTER TABLE public.moderation_actions ADD CONSTRAINT moderation_actions_target_type_check
  CHECK (target_type IN ('company', 'tender', 'profile', 'report'));

ALTER TABLE public.moderation_actions ADD CONSTRAINT moderation_actions_action_type_check
  CHECK (action_type IN (
    'company_suspend',
    'company_restore',
    'company_revoke_verified',
    'tender_close',
    'profile_ban',
    'report_status_change'
  ));

ALTER TABLE public.company_verification_reviews DROP CONSTRAINT IF EXISTS company_verification_reviews_decision_check;
ALTER TABLE public.company_verification_reviews ADD CONSTRAINT company_verification_reviews_decision_check
  CHECK (decision IN ('approved', 'rejected', 'suspended', 'restored', 'revoked'));

-- Владелец после revoked / suspended может снова подать документы
DROP POLICY IF EXISTS "Companies: owner submit verification" ON public.companies;
CREATE POLICY "Companies: owner submit verification" ON public.companies
  FOR UPDATE USING (
    owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND verification_status::text IN ('draft', 'rejected', 'suspended', 'revoked')
  )
  WITH CHECK (
    owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND verification_status::text IN ('draft', 'rejected', 'suspended', 'revoked', 'pending')
  );

DROP POLICY IF EXISTS "Company documents: owner insert" ON public.company_documents;
CREATE POLICY "Company documents: owner insert" ON public.company_documents
  FOR INSERT WITH CHECK (
    uploaded_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
      AND c.verification_status::text IN ('draft', 'rejected', 'suspended', 'revoked')
    )
  );

DROP POLICY IF EXISTS "Company documents: owner delete draft" ON public.company_documents;
CREATE POLICY "Company documents: owner delete draft" ON public.company_documents
  FOR DELETE USING (
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
      AND c.verification_status::text IN ('draft', 'rejected', 'suspended', 'revoked')
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
      AND c.verification_status::text IN ('draft', 'rejected', 'suspended', 'revoked')
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
      AND c.verification_status::text IN ('draft', 'rejected', 'suspended', 'revoked')
    )
  );

CREATE OR REPLACE FUNCTION public.moderator_set_profile_ban(
  p_profile_id uuid,
  p_until timestamptz,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_moderator_or_admin() THEN
    RAISE EXCEPTION 'Недостаточно прав';
  END IF;
  UPDATE public.profiles
  SET banned_until = p_until, ban_reason = NULLIF(trim(p_reason), '')
  WHERE id = p_profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.moderator_set_profile_ban(uuid, timestamptz, text) TO authenticated;
