-- GRANT для таблиц верификации (созданы после api_grants — без прав INSERT падал с «Ошибка сохранения»)
GRANT SELECT, INSERT, DELETE ON public.company_documents TO authenticated;
GRANT SELECT, INSERT ON public.company_verification_reviews TO authenticated;

-- Витрина: услуги/материалы/ролики только от проверенных компаний (владелец и модератор видят свои)
CREATE OR REPLACE FUNCTION public.is_company_publicly_visible(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = p_company_id
      AND (
        c.verification_status = 'verified'
        OR c.owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        OR public.is_moderator_or_admin()
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tender_publicly_visible(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.owner_id = p_client_id)
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.owner_id = p_client_id AND c.verification_status = 'verified'
    )
    OR p_client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR public.is_moderator_or_admin();
$$;

DROP POLICY IF EXISTS "Services: public read" ON public.services;
CREATE POLICY "Services: read verified company" ON public.services
  FOR SELECT USING (public.is_company_publicly_visible(company_id));

DROP POLICY IF EXISTS "Tenders: public read" ON public.tenders;
CREATE POLICY "Tenders: read verified author" ON public.tenders
  FOR SELECT USING (public.is_tender_publicly_visible(client_id));

DROP POLICY IF EXISTS "Promo posts: public read" ON public.company_promo_posts;
CREATE POLICY "Promo posts: read verified company" ON public.company_promo_posts
  FOR SELECT USING (public.is_company_publicly_visible(company_id));
