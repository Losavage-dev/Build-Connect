-- Фаза 6: отзывы только после завершённой заявки, жалобы на компанию/тендер

-- Один отзыв на компанию от одного пользователя
CREATE UNIQUE INDEX IF NOT EXISTS unique_review_per_user_company
  ON public.reviews (company_id, author_id);

DROP POLICY IF EXISTS "Reviews: auth insert" ON public.reviews;
CREATE POLICY "Reviews: auth insert after completed request" ON public.reviews
  FOR INSERT WITH CHECK (
    author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.requests r
      WHERE r.company_id = company_id
        AND r.client_id = author_id
        AND r.status = 'completed'
    )
  );

-- Жалобы (модерация вручную через Dashboard / SQL)
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('company', 'tender')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_target_idx ON public.reports (target_type, target_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports (status, created_at DESC);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reports: auth insert" ON public.reports;
CREATE POLICY "Reports: auth insert" ON public.reports
  FOR INSERT WITH CHECK (
    reporter_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Reports: reporter read own" ON public.reports;
CREATE POLICY "Reports: reporter read own" ON public.reports
  FOR SELECT USING (
    reporter_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

COMMENT ON TABLE public.reports IS 'Жалобы пользователей на компанию или тендер';
