-- События пользователя для персонализированных рекомендаций
CREATE TABLE IF NOT EXISTS public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_events_event_type_check CHECK (
    event_type IN (
      'view_company',
      'view_tender',
      'contact_company',
      'bid_tender',
      'like_promo',
      'view_promo'
    )
  ),
  CONSTRAINT user_events_entity_type_check CHECK (
    entity_type IN ('company', 'tender', 'promo_post', 'service', 'material')
  )
);

CREATE INDEX IF NOT EXISTS user_events_profile_created_idx
  ON public.user_events (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_events_entity_idx
  ON public.user_events (entity_type, entity_id, created_at DESC);

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_events: own select"
  ON public.user_events FOR SELECT
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "user_events: own insert"
  ON public.user_events FOR INSERT
  WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Агрегат популярности компаний (заявки за 30 дней) — для «как в соцсетях»
CREATE OR REPLACE FUNCTION public.get_trending_company_ids(p_limit int DEFAULT 30)
RETURNS TABLE(company_id uuid, request_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.company_id, count(*)::bigint AS request_count
  FROM public.requests r
  WHERE r.company_id IS NOT NULL
    AND r.created_at > now() - interval '30 days'
  GROUP BY r.company_id
  ORDER BY request_count DESC
  LIMIT greatest(p_limit, 1);
$$;

REVOKE ALL ON FUNCTION public.get_trending_company_ids(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_trending_company_ids(int) TO anon, authenticated;
