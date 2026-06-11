-- Тендер = спрос (заказ работ). Видимость не зависит от верификации компании автора.
-- Верификация по-прежнему влияет на каталог, услуги, материалы и promo feed.

CREATE OR REPLACE FUNCTION public.is_tender_publicly_visible(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT true;
$$;

COMMENT ON FUNCTION public.is_tender_publicly_visible(uuid) IS
  'Тендеры видны всем участникам витрины; верификация компании — для каталога и откликов, не для публикации тендера.';

DROP POLICY IF EXISTS "Tenders: read verified author" ON public.tenders;
CREATE POLICY "Tenders: public read" ON public.tenders
  FOR SELECT USING (public.is_tender_publicly_visible(client_id));
