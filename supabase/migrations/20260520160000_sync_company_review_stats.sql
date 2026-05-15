-- Рейтинг и число отзывов компании считаются из таблицы reviews (не вручную в seed)

CREATE OR REPLACE FUNCTION public.sync_company_review_stats(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_avg numeric;
BEGIN
  SELECT count(*)::int, avg(rating)::numeric
  INTO v_count, v_avg
  FROM public.reviews
  WHERE company_id = p_company_id;

  UPDATE public.companies
  SET
    review_count = COALESCE(v_count, 0),
    rating = CASE WHEN COALESCE(v_count, 0) > 0 THEN round(v_avg, 1) ELSE 0 END,
    updated_at = now()
  WHERE id = p_company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_company_review_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_company_review_stats(OLD.company_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.company_id IS DISTINCT FROM NEW.company_id THEN
    PERFORM public.sync_company_review_stats(OLD.company_id);
  END IF;

  PERFORM public.sync_company_review_stats(NEW.company_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_sync_company_stats ON public.reviews;
CREATE TRIGGER trg_reviews_sync_company_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_company_review_stats();

-- Пересчитать все компании
DO $$
DECLARE
  cid uuid;
BEGIN
  FOR cid IN SELECT id FROM public.companies LOOP
    PERFORM public.sync_company_review_stats(cid);
  END LOOP;
END $$;
