-- Фаза 1: справочник материалов, агрегаты цен по платформе, сравнение объявлений

-- ---------------------------------------------------------------------------
-- Справочник материалов (SKU)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.market_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  material_group text NOT NULL,
  price_unit text NOT NULL CHECK (price_unit IN ('m2', 'm3', 'ton', 'piece', 'bag', 'lm')),
  unit_label text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.market_products IS 'Справочник типовых материалов для сравнения цен';

CREATE INDEX IF NOT EXISTS idx_market_products_group ON public.market_products (material_group);
CREATE INDEX IF NOT EXISTS idx_market_products_name ON public.market_products (name);

-- ---------------------------------------------------------------------------
-- Связь объявлений с справочником
-- ---------------------------------------------------------------------------
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS market_product_id uuid REFERENCES public.market_products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS price_unit text CHECK (price_unit IS NULL OR price_unit IN ('m2', 'm3', 'ton', 'piece', 'bag', 'lm'));

COMMENT ON COLUMN public.services.market_product_id IS 'Типовой материал для расчёта медианы';
COMMENT ON COLUMN public.services.price_unit IS 'Единица price (должна совпадать со справочником)';

CREATE INDEX IF NOT EXISTS idx_services_market_product ON public.services (market_product_id)
  WHERE category = 'Материалы';

-- ---------------------------------------------------------------------------
-- Медиана по платформе (город + SKU + единица)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_price_aggregates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  market_product_id uuid NOT NULL REFERENCES public.market_products(id) ON DELETE CASCADE,
  price_unit text NOT NULL,
  listing_count integer NOT NULL DEFAULT 0,
  median_price numeric,
  p25_price numeric,
  p75_price numeric,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city, market_product_id, price_unit)
);

COMMENT ON TABLE public.platform_price_aggregates IS 'Медиана цен объявлений BuildConnect по городу и материалу';

-- ---------------------------------------------------------------------------
-- Сравнение конкретного объявления с медианой
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listing_price_insights (
  service_id uuid PRIMARY KEY REFERENCES public.services(id) ON DELETE CASCADE,
  city text NOT NULL,
  market_product_id uuid NOT NULL REFERENCES public.market_products(id) ON DELETE CASCADE,
  listing_price numeric NOT NULL,
  median_price numeric NOT NULL,
  delta_pct numeric NOT NULL,
  listing_count integer NOT NULL DEFAULT 0,
  computed_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.listing_price_insights IS 'Объявление vs медиана на платформе (%)';

-- ---------------------------------------------------------------------------
-- Задел фазы 2: внешние источники (парсер)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.market_price_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  city text,
  market_product_id uuid REFERENCES public.market_products(id) ON DELETE SET NULL,
  price numeric NOT NULL,
  price_unit text NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  raw_title text,
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.market_price_aggregates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  market_product_id uuid NOT NULL REFERENCES public.market_products(id) ON DELETE CASCADE,
  price_unit text NOT NULL,
  source_scope text NOT NULL DEFAULT 'external',
  observation_count integer NOT NULL DEFAULT 0,
  median_price numeric,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city, market_product_id, price_unit, source_scope)
);

-- ---------------------------------------------------------------------------
-- Наполнение справочника (из MATERIAL_CATALOG + сэндвич-панели)
-- ---------------------------------------------------------------------------
INSERT INTO public.market_products (slug, name, material_group, price_unit, unit_label) VALUES
  ('armatura-a500c', 'Арматура A500C', 'Металлопрокат', 'ton', '₸/т'),
  ('armatura-aiii', 'Арматура AIII', 'Металлопрокат', 'ton', '₸/т'),
  ('balka-dvutavr', 'Балка двутавровая', 'Металлопрокат', 'ton', '₸/т'),
  ('shveller', 'Швеллер', 'Металлопрокат', 'ton', '₸/т'),
  ('ugolok-stalnoy', 'Уголок стальной', 'Металлопрокат', 'ton', '₸/т'),
  ('list-stalnoy', 'Лист стальной', 'Металлопрокат', 'ton', '₸/т'),
  ('truba-profilnaya', 'Профильная труба', 'Металлопрокат', 'ton', '₸/т'),
  ('setka-kladochnaya', 'Сетка кладочная', 'Металлопрокат', 'm2', '₸/м²'),
  ('beton-m200', 'Бетон М200', 'Бетон и растворы', 'm3', '₸/м³'),
  ('beton-m300', 'Бетон М300', 'Бетон и растворы', 'm3', '₸/м³'),
  ('beton-m350', 'Бетон М350', 'Бетон и растворы', 'm3', '₸/м³'),
  ('cement-m400', 'Цемент М400', 'Бетон и растворы', 'ton', '₸/т'),
  ('cement-m500', 'Цемент М500', 'Бетон и растворы', 'ton', '₸/т'),
  ('peschanobeton', 'Пескобетон', 'Бетон и растворы', 'bag', '₸/мешок'),
  ('rastvor-kladochnyy', 'Раствор кладочный', 'Бетон и растворы', 'm3', '₸/м³'),
  ('cps-smes', 'Цементно-песчаная смесь', 'Бетон и растворы', 'bag', '₸/мешок'),
  ('kirpich-oblitsovochnyy', 'Кирпич облицовочный', 'Кирпич и блоки', 'piece', '₸/шт'),
  ('kirpich-ryadovoy', 'Кирпич рядовой', 'Кирпич и блоки', 'piece', '₸/шт'),
  ('gazobeton-d500', 'Газобетонный блок', 'Кирпич и блоки', 'm3', '₸/м³'),
  ('penoblok', 'Пеноблок', 'Кирпич и блоки', 'm3', '₸/м³'),
  ('keramicheskiy-blok', 'Керамический блок', 'Кирпич и блоки', 'piece', '₸/шт'),
  ('doska-obreznaya', 'Доска обрезная', 'Древесина и пиломатериалы', 'm3', '₸/м³'),
  ('brus', 'Брус', 'Древесина и пиломатериалы', 'm3', '₸/м³'),
  ('fanera-fk', 'Фанера ФК', 'Древесина и пиломатериалы', 'm2', '₸/м²'),
  ('fanera-fsf', 'Фанера ФСФ', 'Древесина и пиломатериалы', 'm2', '₸/м²'),
  ('osb-3', 'OSB-3', 'Древесина и пиломатериалы', 'm2', '₸/м²'),
  ('vagonka', 'Вагонка', 'Древесина и пиломатериалы', 'm2', '₸/м²'),
  ('metallocherepitsa', 'Металлочерепица', 'Кровля и фасад', 'm2', '₸/м²'),
  ('profnastil-krovelnyy', 'Профнастил кровельный', 'Кровля и фасад', 'm2', '₸/м²'),
  ('myagkaya-krovlya', 'Мягкая кровля', 'Кровля и фасад', 'm2', '₸/м²'),
  ('vodostok', 'Водосточная система', 'Кровля и фасад', 'lm', '₸/п.м'),
  ('sayding', 'Сайдинг', 'Кровля и фасад', 'm2', '₸/м²'),
  ('fasadnye-paneli', 'Фасадные панели', 'Кровля и фасад', 'm2', '₸/м²'),
  ('sendvich-panel-80', 'Сэндвич-панель 80 мм', 'Кровля и фасад', 'm2', '₸/м²'),
  ('sendvich-panel-100', 'Сэндвич-панель 100 мм', 'Кровля и фасад', 'm2', '₸/м²'),
  ('sendvich-panel-150', 'Сэндвич-панель 150 мм', 'Кровля и фасад', 'm2', '₸/м²'),
  ('mineralnaya-vata', 'Минеральная вата', 'Изоляция', 'm2', '₸/м²'),
  ('penoplast', 'Пенопласт', 'Изоляция', 'm2', '₸/м²'),
  ('xps', 'Экструдированный пенополистирол', 'Изоляция', 'm2', '₸/м²'),
  ('paroizolyatsiya', 'Пароизоляция', 'Изоляция', 'm2', '₸/м²'),
  ('gidromembrana', 'Гидроизоляционная мембрана', 'Изоляция', 'm2', '₸/м²'),
  ('pesok-stroitelnyy', 'Песок строительный', 'Сыпучие материалы', 'm3', '₸/м³'),
  ('scheben-5-20', 'Щебень фракция 5–20', 'Сыпучие материалы', 'm3', '₸/м³'),
  ('otsev', 'Отсев', 'Сыпучие материалы', 'm3', '₸/м³'),
  ('gipsokarton', 'Гипсокартон', 'Отделочные материалы', 'm2', '₸/м²'),
  ('shtukaturka', 'Штукатурка', 'Отделочные материалы', 'bag', '₸/мешок'),
  ('shpaklevka', 'Шпаклёвка', 'Отделочные материалы', 'bag', '₸/мешок'),
  ('plitka-keramicheskaya', 'Плитка керамическая', 'Отделочные материалы', 'm2', '₸/м²'),
  ('laminat', 'Ламинат', 'Отделочные материалы', 'm2', '₸/м²'),
  ('truby-ppr', 'Трубы ППР', 'Инженерные материалы', 'lm', '₸/п.м'),
  ('kabel-elektricheskiy', 'Кабель электрический', 'Инженерные материалы', 'lm', '₸/п.м')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Пересчёт медианы и insights (только verified компании, category = Материалы)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_platform_price_aggregates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.platform_price_aggregates;
  DELETE FROM public.listing_price_insights;

  INSERT INTO public.platform_price_aggregates (
    city, market_product_id, price_unit, listing_count, median_price, p25_price, p75_price, computed_at
  )
  SELECT
    c.city,
    s.market_product_id,
    s.price_unit,
    COUNT(*)::integer AS listing_count,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY s.price) AS median_price,
    percentile_cont(0.25) WITHIN GROUP (ORDER BY s.price) AS p25_price,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY s.price) AS p75_price,
    now()
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

  INSERT INTO public.listing_price_insights (
    service_id, city, market_product_id, listing_price, median_price, delta_pct, listing_count, computed_at
  )
  SELECT
    s.id,
    c.city,
    s.market_product_id,
    s.price,
    a.median_price,
    ROUND(((s.price - a.median_price) / NULLIF(a.median_price, 0)) * 100, 1),
    a.listing_count,
    now()
  FROM public.services s
  INNER JOIN public.companies c ON c.id = s.company_id
  INNER JOIN public.platform_price_aggregates a
    ON a.city = c.city
   AND a.market_product_id = s.market_product_id
   AND a.price_unit = s.price_unit
  WHERE s.category = 'Материалы'
    AND s.market_product_id IS NOT NULL
    AND a.listing_count >= 5
    AND a.median_price IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION public.recompute_platform_price_aggregates IS
  'Пересчёт медианы цен по городу/SKU; insights только при listing_count >= 5';

GRANT EXECUTE ON FUNCTION public.recompute_platform_price_aggregates() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.market_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_price_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_price_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_price_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_price_aggregates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Market products: public read" ON public.market_products
  FOR SELECT USING (true);

CREATE POLICY "Platform aggregates: public read" ON public.platform_price_aggregates
  FOR SELECT USING (true);

CREATE POLICY "Listing insights: public read" ON public.listing_price_insights
  FOR SELECT USING (true);

CREATE POLICY "Market observations: staff read" ON public.market_price_observations
  FOR SELECT USING (public.is_moderator_or_admin());

CREATE POLICY "Market aggregates external: public read" ON public.market_price_aggregates
  FOR SELECT USING (true);

GRANT SELECT ON public.market_products TO anon, authenticated;
GRANT SELECT ON public.platform_price_aggregates TO anon, authenticated;
GRANT SELECT ON public.listing_price_insights TO anon, authenticated;
