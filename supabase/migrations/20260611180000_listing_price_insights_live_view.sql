-- Сравнение цен материалов: live-view вместо таблицы, которую нужно пересчитывать вручную.
-- Порог для бейджа: >= 2 объявления в городе по одному SKU (было >= 5).

-- Привязка старых объявлений к справочнику по точному названию
UPDATE public.services s
SET
  market_product_id = mp.id,
  price_unit = COALESCE(s.price_unit, mp.price_unit)
FROM public.market_products mp
WHERE s.category = 'Материалы'
  AND s.market_product_id IS NULL
  AND s.title = mp.name;

DROP TABLE IF EXISTS public.listing_price_insights CASCADE;

CREATE OR REPLACE VIEW public.listing_price_insights AS
WITH aggregates AS (
  SELECT
    c.city,
    s.market_product_id,
    s.price_unit,
    COUNT(*)::integer AS listing_count,
    (percentile_cont(0.5) WITHIN GROUP (ORDER BY s.price))::numeric AS median_price
  FROM public.services s
  INNER JOIN public.companies c ON c.id = s.company_id
  WHERE s.category = 'Материалы'
    AND s.market_product_id IS NOT NULL
    AND s.price_unit IS NOT NULL
    AND c.verification_status = 'verified'
    AND c.city IS NOT NULL
    AND TRIM(c.city) <> ''
  GROUP BY c.city, s.market_product_id, s.price_unit
  HAVING COUNT(*) >= 2
)
SELECT
  s.id AS service_id,
  c.city,
  s.market_product_id,
  s.price AS listing_price,
  a.median_price,
  ROUND(
    ((s.price::numeric - a.median_price) / NULLIF(a.median_price, 0)) * 100,
    1
  ) AS delta_pct,
  a.listing_count,
  now() AS computed_at
FROM public.services s
INNER JOIN public.companies c ON c.id = s.company_id
INNER JOIN aggregates a
  ON a.city = c.city
 AND a.market_product_id = s.market_product_id
 AND a.price_unit = s.price_unit
WHERE s.category = 'Материалы'
  AND s.market_product_id IS NOT NULL
  AND c.verification_status = 'verified';

COMMENT ON VIEW public.listing_price_insights IS
  'Объявление vs медиана на платформе; обновляется автоматически, минимум 2 объявления в городе';

GRANT SELECT ON public.listing_price_insights TO anon, authenticated;

-- platform_price_aggregates — тоже live-view (для отчётов и seed-диагностики)
DROP TABLE IF EXISTS public.platform_price_aggregates CASCADE;

CREATE OR REPLACE VIEW public.platform_price_aggregates AS
SELECT
  gen_random_uuid() AS id,
  c.city,
  s.market_product_id,
  s.price_unit,
  COUNT(*)::integer AS listing_count,
  (percentile_cont(0.5) WITHIN GROUP (ORDER BY s.price))::numeric AS median_price,
  (percentile_cont(0.25) WITHIN GROUP (ORDER BY s.price))::numeric AS p25_price,
  (percentile_cont(0.75) WITHIN GROUP (ORDER BY s.price))::numeric AS p75_price,
  now() AS computed_at
FROM public.services s
INNER JOIN public.companies c ON c.id = s.company_id
WHERE s.category = 'Материалы'
  AND s.market_product_id IS NOT NULL
  AND s.price_unit IS NOT NULL
  AND c.verification_status = 'verified'
  AND c.city IS NOT NULL
  AND TRIM(c.city) <> ''
GROUP BY c.city, s.market_product_id, s.price_unit
HAVING COUNT(*) >= 1;

GRANT SELECT ON public.platform_price_aggregates TO anon, authenticated;

-- Совместимость: seed-скрипты и createService по-прежнему могут вызывать RPC
CREATE OR REPLACE FUNCTION public.recompute_platform_price_aggregates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Данные считаются во VIEW listing_price_insights / platform_price_aggregates
  NULL;
END;
$$;

COMMENT ON FUNCTION public.recompute_platform_price_aggregates IS
  'No-op: медианы считаются во VIEW listing_price_insights (live)';
