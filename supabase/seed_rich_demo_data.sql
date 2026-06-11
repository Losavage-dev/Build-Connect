-- =============================================================================
-- BuildConnect: расширенные demo-данные (реалистичные названия, витрина, медиана цен)
-- Запуск ПОСЛЕ: seed_test_accounts.sql
-- Рекомендуется ДО или ПОСЛЕ: seed_market_materials.sql (вместе дают полное покрытие SKU)
-- Пароль всех @test.com: 123456
-- Идемпотентность: BIN 990001…, маркер ‖seed-rich‖ в description объявлений
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Очистка предыдущего прогона
-- -----------------------------------------------------------------------------
DELETE FROM public.user_events
WHERE metadata->>'seed' = 'rich_demo';

DELETE FROM public.tenders WHERE title LIKE '[Seed] %';

DELETE FROM public.services
WHERE description LIKE '%‖seed-rich‖%'
   OR company_id IN (SELECT id FROM public.companies WHERE bin LIKE '990001%');

DELETE FROM public.services
WHERE company_id IN (SELECT id FROM public.companies WHERE name ILIKE '%Alatau Build%')
  AND title IN (
    'Проектирование коттеджа', 'Монтаж металлоконструкций', 'Устройство монолитного перекрытия',
    'Кладка кирpича и блока', 'Черновая отделка', 'Монтаж окон и дверей',
    'Устройство инженерных сетей', 'Благоустройство участка', 'Технический надзор объекта',
    'Строительство бань и саун', 'Реконструкция коммерческих помещений', 'Аренда строительных лесов'
  );

DELETE FROM public.company_promo_posts
WHERE company_id IN (SELECT id FROM public.companies WHERE bin LIKE '990001%')
   OR youtube_video_id IN ('Tb1NGr50VJo', 'aqz-KE-bpKQ', 'E8O-_A0qfGE', 'M7lc1UVf-VE');

DELETE FROM public.projects
WHERE company_id IN (SELECT id FROM public.companies WHERE bin LIKE '990001%');

DELETE FROM public.company_categories
WHERE company_id IN (SELECT id FROM public.companies WHERE bin LIKE '990001%');

DELETE FROM public.companies WHERE bin LIKE '990001%';

-- -----------------------------------------------------------------------------
DO $$
DECLARE
  p_client uuid;
  p_client_taraz uuid;
  p_clientco uuid;
  p_cont1 uuid;
  p_cont2 uuid;
  p_cont3 uuid;
  p_cont4 uuid;
  p_cont_roof uuid;
  p_sup uuid;
  p_sup2 uuid;
  p_sup_noco uuid;
  c_id uuid;
  c_alatau uuid;
  c_monolit uuid;
  c_materials uuid;
  city text;
  cities text[] := ARRAY['Астана', 'Алматы', 'Тараз', 'Шымкент'];
  city_prefix text[] := ARRAY['01', '02', '03', '04'];
  snab_names text[];
  snab_addresses text[];
  snab_emails text[];
  snab_idx int;
  owners uuid[];
  owner_idx int;
  company_ids uuid[];
  i int;
  j int;
  ci int;
  bin_code text;
  product_rec record;
  base numeric;
  listing_price numeric;
  slug_list text[] := ARRAY[
    'cement-m500', 'cement-m400', 'armatura-a500c', 'beton-m300', 'gazobeton-d500',
    'sendvich-panel-100', 'profnastil-krovelnyy', 'mineralnaya-vata', 'gipsokarton',
    'pesok-stroitelnyy', 'scheben-5-20', 'plitka-keramicheskaya'
  ];
  si int;
  seed_marker text := '‖seed-rich‖';
BEGIN
  SELECT p.id INTO p_client FROM public.profiles p JOIN auth.users u ON u.id = p.user_id WHERE u.email = 'client@test.com';
  SELECT p.id INTO p_client_taraz FROM public.profiles p JOIN auth.users u ON u.id = p.user_id WHERE u.email = 'client-taraz@test.com';
  SELECT p.id INTO p_clientco FROM public.profiles p JOIN auth.users u ON u.id = p.user_id WHERE u.email = 'clientco@test.com';
  SELECT p.id INTO p_cont1 FROM public.profiles p JOIN auth.users u ON u.id = p.user_id WHERE u.email = 'contractor1@test.com';
  SELECT p.id INTO p_cont2 FROM public.profiles p JOIN auth.users u ON u.id = p.user_id WHERE u.email = 'contractor2@test.com';
  SELECT p.id INTO p_cont3 FROM public.profiles p JOIN auth.users u ON u.id = p.user_id WHERE u.email = 'contractor3@test.com';
  SELECT p.id INTO p_cont4 FROM public.profiles p JOIN auth.users u ON u.id = p.user_id WHERE u.email = 'contractor4@test.com';
  SELECT p.id INTO p_cont_roof FROM public.profiles p JOIN auth.users u ON u.id = p.user_id WHERE u.email = 'contractor-roof@test.com';
  SELECT p.id INTO p_sup FROM public.profiles p JOIN auth.users u ON u.id = p.user_id WHERE u.email = 'supplier@test.com';
  SELECT p.id INTO p_sup2 FROM public.profiles p JOIN auth.users u ON u.id = p.user_id WHERE u.email = 'supplier2@test.com';
  SELECT p.id INTO p_sup_noco FROM public.profiles p JOIN auth.users u ON u.id = p.user_id WHERE u.email = 'supplier-noco@test.com';

  SELECT id INTO c_alatau FROM public.companies WHERE name ILIKE '%Alatau Build%' LIMIT 1;
  SELECT id INTO c_monolit FROM public.companies WHERE name ILIKE '%Astana Monolit%' LIMIT 1;
  SELECT id INTO c_materials FROM public.companies WHERE name ILIKE '%Steppe Materials%' LIMIT 1;

  IF p_cont3 IS NULL OR c_materials IS NULL THEN
    RAISE EXCEPTION 'Сначала выполните seed_test_accounts.sql';
  END IF;

  owners := ARRAY[p_sup, p_sup2, p_sup_noco, p_sup, p_sup2, p_sup_noco];

  snab_names := ARRAY[
    -- Астана (1–6)
    'ТОО «Capital Snab»', 'ТОО «Astana StroyMarket»', 'ТОО «Baiterek Materials»', 'ТОО «Esil Cement»', 'ТОО «Nomad Metall»', 'ТОО «QazaqMix Astana»',
    -- Алматы (7–12)
    'ТОО «Almaty Build Trade»', 'ТОО «Zhetysu Snab»', 'ТОО «MegaStroy Almaty»', 'ТОО «Alma Cement Group»', 'ТОО «KazRoof Supply»', 'ТОО «TransStroy Mat»',
    -- Тараз (13–18)
    'ТОО «Taraz Stroy Snab»', 'ТОО «Zhambyl Cement»', 'ТОО «Orken Materials»', 'ТОО «Taraz Mix Beton»', 'ТОО «Asem MetSnab»', 'ТОО «Jetisu Trade Taraz»',
    -- Шымкент (19–24)
    'ТОО «Shymkent StroyOpt»', 'ТОО «Otyrar Materials»', 'ТОО «Turkestan Snab»', 'ТОО «Kentau Cement»', 'ТОО «Silk Road Mat»', 'ТОО «Shym Mix Group»'
  ];

  snab_addresses := ARRAY[
    -- Астана (1–6)
    'пр. Кабанбай батыра 15, склад 1', 'ул. Кенесары 88, база', 'пр. Туран 37, ангар 3',
    'ул. Бейбитшилик 28', 'ул. Кошкарова 12', 'пр. Республики 45',
    -- Алматы (7–12)
    'пр. Райымбека 156, склад А', 'ул. Жандосова 21', 'пр. Абая 85/2',
    'ул. Толе би 155', 'мкр. Алмагул, ул. Розыбакиева 289', 'пр. Сейфуллина 420',
    -- Тараз (13–18)
    'ул. Толе би 156', 'ул. Абая 24', 'пр. Толе би 89, база',
    'ул. Майлина 12', 'ул. Байзакова 34', 'ул. К. Сатпаева 67',
    -- Шымкент (19–24)
    'пр. Байdibek bi 45', 'ул. Тәуке хана 12', 'пр. Кунаева 78',
    'ул. Мадiniy 23', 'ул. Сatpaева 56', 'пр. Республики 112'
  ];

  snab_emails := ARRAY[
    'sales@capital-snab.kz', 'info@astana-stroymarket.kz', 'order@baiterek-materials.kz',
    'cement@esil-cement.kz', 'metal@nomad-metall.kz', 'mix@qazaqmix-astana.kz',
    'trade@almaty-build-trade.kz', 'snab@zhetysu-snab.kz', 'office@megastroy-almaty.kz',
    'cement@alma-cement.kz', 'roof@kazroof-supply.kz', 'logistics@transstroy-mat.kz',
    'info@taraz-stroy-snab.kz', 'order@zhambyl-cement.kz', 'sales@orken-materials.kz',
    'beton@taraz-mix.kz', 'metal@asem-metsnab.kz', 'trade@jetisu-taraz.kz',
    'opt@shymkent-stroyopt.kz', 'warehouse@otyrar-materials.kz', 'info@turkestan-snab.kz',
    'cement@kentau-cement.kz', 'sales@silkroad-mat.kz', 'mix@shym-mix.kz'
  ];

  -- =========================================================================
  -- 1. Региональные компании (подряд / фасад / кровля) — реалистичные карточки
  -- =========================================================================
  INSERT INTO public.companies (owner_id, name, category, city, description, phone, email, address, is_verified, verification_status, rating, review_count, bin)
  VALUES (
    p_cont3, 'ТОО «Жамбыл Строй Групп»', 'Строительство', 'Тараз',
    'Генподряд и реконструкция в Таразе и области. Жилые дома, соцобъекты, инженерные сети.',
    '+77262630101', 'info@zhambyl-stroy.kz', 'ул. Толе би 78', true, 'verified', 4.6, 11, '990001100001'
  ) RETURNING id INTO c_id;
  INSERT INTO public.company_categories (company_id, category) VALUES
    (c_id, 'Строительство'), (c_id, 'Генеральный подряд'), (c_id, 'Ремонт') ON CONFLICT DO NOTHING;

  INSERT INTO public.companies (owner_id, name, category, city, description, phone, email, address, is_verified, verification_status, rating, review_count, bin)
  VALUES (
    p_cont4, 'ТОО «Qala Facade»', 'Фасадные работы', 'Шымкент',
    'Мокрый и вентилируемый фасад, утепление, облицовка керамогранитом. Работаем с девелоперами ЮКО.',
    '+77252530202', 'sales@qala-facade.kz', 'пр. Байдibek bi 12', true, 'verified', 4.4, 7, '990001100002'
  ) RETURNING id INTO c_id;
  INSERT INTO public.company_categories (company_id, category) VALUES
    (c_id, 'Фасадные работы'), (c_id, 'Отделочные работы'), (c_id, 'Утепление и теплоизоляция') ON CONFLICT DO NOTHING;

  INSERT INTO public.companies (owner_id, name, category, city, description, phone, email, address, is_verified, verification_status, rating, review_count, bin)
  VALUES (
    p_cont_roof, 'ТОО «Astana Roof Pro»', 'Кровельные работы', 'Астана',
    'Металлочерепица, мягкая кровля, фальцевая кровля. Гарантия 5 лет, монтаж по SNiP.',
    '+77172730303', 'office@astana-roof.kz', 'ул. Куйши Дина 19', true, 'verified', 4.8, 14, '990001100003'
  ) RETURNING id INTO c_id;
  INSERT INTO public.company_categories (company_id, category) VALUES
    (c_id, 'Кровельные работы'), (c_id, 'Гидроизоляция') ON CONFLICT DO NOTHING;

  INSERT INTO public.companies (owner_id, name, category, city, description, phone, email, address, is_verified, verification_status, rating, review_count, bin)
  VALUES (
    p_cont1, 'ТОО «Alatau Electro»', 'Электромонтаж', 'Алматы',
    'Проектирование и монтаж сетей 0,4–10 кВ, слаботочка, освещение промышленных объектов.',
    '+77272730404', 'project@alatau-electro.kz', 'пр. Достyk 89', true, 'verified', 4.5, 9, '990001100004'
  ) RETURNING id INTO c_id;
  INSERT INTO public.company_categories (company_id, category) VALUES
    (c_id, 'Электромонтаж'), (c_id, 'Слаботочные системы') ON CONFLICT DO NOTHING;

  INSERT INTO public.companies (owner_id, name, category, city, description, phone, email, address, is_verified, verification_status, rating, review_count, bin)
  VALUES (
    p_cont2, 'ТОО «Astana Clima»', 'Вентиляция и кондиционирование', 'Астана',
    'VRV/VRF, приточно-вытяжная вентиляция, диспетчеризация. Сервисное обслуживание.',
    '+77172730505', 'service@astana-clima.kz', 'пр. Кабanbay batyra 21', true, 'verified', 4.3, 6, '990001100005'
  ) RETURNING id INTO c_id;
  INSERT INTO public.company_categories (company_id, category) VALUES
    (c_id, 'Вентиляция и кондиционирование'), (c_id, 'Инженерные системы') ON CONFLICT DO NOTHING;

  INSERT INTO public.companies (owner_id, name, category, city, description, phone, email, address, is_verified, verification_status, rating, review_count, bin)
  VALUES (
    p_sup2, 'ТОО «Almaty Supply Hub»', 'Материалы', 'Алматы',
    'Складской комплекс 3200 м²: сыпучие, металл, кровля. Самовывоз и доставка по городу.',
    '+77272730606', 'warehouse@almaty-supply.kz', 'ул. Райymbek 140', true, 'verified', 4.6, 10, '990001100006'
  ) RETURNING id INTO c_id;
  INSERT INTO public.company_categories (company_id, category) VALUES
    (c_id, 'Материалы'), (c_id, 'Логистика и доставка на объект') ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- 2. ТОО «Steppe Materials» — большая витрина (30+ материалов, 12 услуг)
  -- =========================================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'market_products') THEN
    FOR product_rec IN
      SELECT id, slug, name, material_group, price_unit
      FROM public.market_products
      WHERE slug IN (
        'armatura-a500c', 'armatura-aiii', 'beton-m200', 'beton-m300', 'beton-m350',
        'cement-m400', 'cement-m500', 'gazobeton-d500', 'penoblok', 'kirpich-oblitsovochnyy',
        'sendvich-panel-80', 'sendvich-panel-100', 'sendvich-panel-150',
        'profnastil-krovelnyy', 'metallocherepitsa', 'mineralnaya-vata', 'penoplast', 'xps',
        'pesok-stroitelnyy', 'scheben-5-20', 'otsev', 'gipsokarton', 'shtukaturka',
        'shpaklevka', 'plitka-keramicheskaya', 'laminat', 'truby-ppr', 'kabel-elektricheskiy',
        'doska-obreznaya', 'fanera-fsf', 'osb-3', 'vodostok', 'sayding'
      )
      ORDER BY material_group, name
    LOOP
      base := CASE product_rec.slug
        WHEN 'armatura-a500c' THEN 428000 WHEN 'armatura-aiii' THEN 415000
        WHEN 'beton-m200' THEN 24000 WHEN 'beton-m300' THEN 28200 WHEN 'beton-m350' THEN 30500
        WHEN 'cement-m400' THEN 51800 WHEN 'cement-m500' THEN 55200
        WHEN 'gazobeton-d500' THEN 186000 WHEN 'penoblok' THEN 92000
        WHEN 'kirpich-oblitsovochnyy' THEN 185 WHEN 'sendvich-panel-80' THEN 3580
        WHEN 'sendvich-panel-100' THEN 4120 WHEN 'sendvich-panel-150' THEN 4980
        WHEN 'profnastil-krovelnyy' THEN 3180 WHEN 'metallocherepitsa' THEN 3450
        WHEN 'mineralnaya-vata' THEN 1780 WHEN 'penoplast' THEN 980 WHEN 'xps' THEN 4200
        WHEN 'pesok-stroitelnyy' THEN 8800 WHEN 'scheben-5-20' THEN 12200 WHEN 'otsev' THEN 6500
        WHEN 'gipsokarton' THEN 2180 WHEN 'shtukaturka' THEN 1850 WHEN 'shpaklevka' THEN 1620
        WHEN 'plitka-keramicheskaya' THEN 4480 WHEN 'laminat' THEN 5200
        WHEN 'truby-ppr' THEN 890 WHEN 'kabel-elektricheskiy' THEN 420
        WHEN 'doska-obreznaya' THEN 185000 WHEN 'fanera-fsf' THEN 9800 WHEN 'osb-3' THEN 7200
        WHEN 'vodostok' THEN 3200 WHEN 'sayding' THEN 2650
        ELSE 10000
      END;

      listing_price := ROUND((base * (0.94 + random() * 0.14))::numeric, 0);

      INSERT INTO public.services (company_id, title, description, price, category, material_group, market_product_id, price_unit)
      VALUES (
        c_materials,
        product_rec.name,
        'Со склада Steppe Materials, Астана. Сертификаты, накладная. ' || seed_marker,
        listing_price,
        'Материалы',
        product_rec.material_group,
        product_rec.id,
        product_rec.price_unit
      );
    END LOOP;
  ELSE
    INSERT INTO public.services (company_id, title, description, price, category, material_group) VALUES
      (c_materials, 'Цемент М500', 'Мешок 50 кг, паллеты ' || seed_marker, 56000, 'Материалы', 'Бетон и растворы'),
      (c_materials, 'Минеральная вата 50 мм', 'Утеплитель, упаковка ' || seed_marker, 1750, 'Материалы', 'Изоляция'),
      (c_materials, 'Профнастил С21', 'Оцинковка 0,5 мм ' || seed_marker, 3200, 'Материалы', 'Кровля и фасад');
  END IF;

  INSERT INTO public.services (company_id, title, description, price, category) VALUES
    (c_materials, 'Доставка по Астане (до 5 т)', 'Манипулятор / самосвал, разгрузка', 18000, 'Логистика и доставка на объект'),
    (c_materials, 'Доставка за город', 'Расчёт по км, мин. заказ 15 т', 45000, 'Логистика и доставка на объект'),
    (c_materials, 'Резка арматуры в размер', 'Пог пог. м, чертёж заказчика', 850, 'Металлопрокат'),
    (c_materials, 'Комплектация объекта «под ключ»', 'Смета, закуп, логистика, 3–5 дней', 0, 'Материалы'),
    (c_materials, 'Погрузка краном на объекте', '1 смена, бригада 2 чел.', 95000, 'Логистика и доставка на объект'),
    (c_materials, 'Хранение на складе', 'До 30 суток бесплатно при заказе от 500 тыс. ₸', 0, 'Материалы'),
    (c_materials, 'Ночная отгрузка со склада', '22:00–06:00, без простоя на объекте', 35000, 'Логистика и доставка на объект'),
    (c_materials, 'Экспресс-доставка 4 часа', 'По Астане, до 3 т', 12000, 'Логистика и доставка на объект');

  UPDATE public.services SET description = description || ' ' || seed_marker
  WHERE company_id = c_materials AND category <> 'Материалы' AND description NOT LIKE '%' || seed_marker || '%';

  -- =========================================================================
  -- 3. ТОО «Alatau Build» — расширенная витрина услуг (18+ позиций)
  -- =========================================================================
  IF c_alatau IS NOT NULL THEN
    INSERT INTO public.services (company_id, title, description, price, category) VALUES
      (c_alatau, 'Проектирование коттеджа', 'Эскиз + рабочая документация, авторский надзор. ' || seed_marker, 1350000, 'Проектирование и архитектура'),
      (c_alatau, 'Монтаж металлоконструкций', 'Сварка, антикор, монтаж по проекту', 19500, 'Монтаж металлоконструкций'),
      (c_alatau, 'Устройство монолитного перекрытия', 'Опалубка, армирование, заливка', 5200, 'Бетонные работы'),
      (c_alatau, 'Кладка кирпича и блока', 'Несущие и перегородочные стены', 7800, 'Кладка'),
      (c_alatau, 'Черновая отделка', 'Штукатурка, стяжка, шумоизоляция', 6500, 'Отделочные работы'),
      (c_alatau, 'Монтаж окон и дверей', 'ПВХ / алюминий, откосы', 42000, 'Окна и двери'),
      (c_alatau, 'Устройство инженерных сетей', 'Вода, канализация, отопление', 380000, 'Инженерные системы'),
      (c_alatau, 'Благоустройство участка', 'Дорожки, дренаж, озеленение', 4500, 'Ландшафтный дизайн'),
      (c_alatau, 'Технический надзор объекта', 'Еженедельные отчёты, фото', 280000, 'Технический надзор и экспертиза'),
      (c_alatau, 'Строительство бань и саун', 'Под ключ, отделка, печь', 4200000, 'Строительство'),
      (c_alatau, 'Реконструкция коммерческих помещений', 'От демонтажа до сдачи', 12000, 'Ремонт'),
      (c_alatau, 'Аренда строительных лесов', 'Комплект на 2 недели', 85000, 'Строительные леса и опалубка');
  END IF;

  -- =========================================================================
  -- 4. Склады-сатellites: ≥6 компаний в городе × ≥6 объявлений на SKU → медиана цен
  -- =========================================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'market_products') THEN
    FOR ci IN 1..4 LOOP
      city := cities[ci];
      company_ids := ARRAY[]::uuid[];

      FOR i IN 1..6 LOOP
        bin_code := '990001' || city_prefix[ci] || lpad(i::text, 4, '0');
        owner_idx := ((i - 1) % 6) + 1;

        snab_idx := (ci - 1) * 6 + i;

        INSERT INTO public.companies (owner_id, name, category, city, description, phone, email, address, is_verified, verification_status, rating, review_count, bin)
        VALUES (
          owners[owner_idx],
          snab_names[snab_idx],
          'Материалы',
          city,
          'Оптовая и розничная продажа стройматериалов. Самовывоз и доставка по ' || city || '.',
          '+7700' || city_prefix[ci] || lpad((2000 + i)::text, 5, '0'),
          snab_emails[snab_idx],
          snab_addresses[snab_idx],
          true, 'verified', 4.0 + (i * 0.1), i * 2,
          bin_code
        )
        RETURNING id INTO c_id;

        INSERT INTO public.company_categories (company_id, category) VALUES (c_id, 'Материалы') ON CONFLICT DO NOTHING;
        company_ids := array_append(company_ids, c_id);
      END LOOP;

      FOR si IN 1..array_length(slug_list, 1) LOOP
        SELECT id, slug, name, material_group, price_unit INTO product_rec
        FROM public.market_products WHERE slug = slug_list[si];

        IF product_rec.id IS NULL THEN CONTINUE; END IF;

        base := CASE product_rec.slug
          WHEN 'cement-m500' THEN 55200 WHEN 'cement-m400' THEN 51800
          WHEN 'armatura-a500c' THEN 428000 WHEN 'beton-m300' THEN 28200
          WHEN 'gazobeton-d500' THEN 186000 WHEN 'sendvich-panel-100' THEN 4120
          WHEN 'profnastil-krovelnyy' THEN 3180 WHEN 'mineralnaya-vata' THEN 1780
          WHEN 'gipsokarton' THEN 2180 WHEN 'pesok-stroitelnyy' THEN 8800
          WHEN 'scheben-5-20' THEN 12200 WHEN 'plitka-keramicheskaya' THEN 4480
          ELSE 10000
        END;

        FOR j IN 1..6 LOOP
          listing_price := ROUND((base * (0.88 + random() * 0.26))::numeric, 0);
          INSERT INTO public.services (company_id, title, description, price, category, material_group, market_product_id, price_unit)
          VALUES (
            company_ids[j],
            product_rec.name,
            'Склад ' || city || ', партия от 1 ' ||
              CASE product_rec.price_unit WHEN 'ton' THEN 'т' WHEN 'm3' THEN 'м³' WHEN 'm2' THEN 'м²' WHEN 'bag' THEN 'меш.' ELSE 'ед.' END ||
              '. ' || seed_marker,
            listing_price,
            'Материалы',
            product_rec.material_group,
            product_rec.id,
            product_rec.price_unit
          );
        END LOOP;
      END LOOP;
    END LOOP;
  END IF;

  -- =========================================================================
  -- 5. Услуги региональных компаний
  -- =========================================================================
  INSERT INTO public.services (company_id, title, description, price, category) VALUES
    ((SELECT id FROM companies WHERE bin = '990001100001'), 'Строительство частного дома', 'Коробка + кровля, Тараз и область', 9200000, 'Строительство'),
    ((SELECT id FROM companies WHERE bin = '990001100001'), 'Капремонт школы / детсада', 'Под ключ, смета по госметоду', 45000000, 'Ремонт'),
    ((SELECT id FROM companies WHERE bin = '990001100002'), 'Мокрый фасад', 'Утепление + штукатурка', 9800, 'Фасадные работы'),
    ((SELECT id FROM companies WHERE bin = '990001100002'), 'Облицовка керамогранитом', 'Кляммеры, вентзазор', 14500, 'Фасадные работы'),
    ((SELECT id FROM companies WHERE bin = '990001100003'), 'Металлочерепица под ключ', 'Материал + монтаж', 6800, 'Кровельные работы'),
    ((SELECT id FROM companies WHERE bin = '990001100004'), 'Монтаж щитового оборудования', '0,4 кВ, автоматика ABB', 465000, 'Электромонтаж'),
    ((SELECT id FROM companies WHERE bin = '990001100005'), 'Проектирование VRV-системы', 'Подбор + смета + пусконаладка', 295000, 'Вентиляция и кондиционирование');

  UPDATE public.services SET description = description || ' ' || seed_marker
  WHERE company_id IN (SELECT id FROM companies WHERE bin LIKE '990001100%')
    AND description NOT LIKE '%' || seed_marker || '%';

  -- =========================================================================
  -- 6. Тендеры (реалистичные формулировки)
  -- =========================================================================
  INSERT INTO public.tenders (client_id, title, description, budget, deadline, status, city, tender_type) VALUES
    (p_client_taraz, '[Seed] Реконструкция школы №12, Тараз', 'Капремонт фасада и кровли, 1180 м². Требуется опыт работ с бюджетными организациями.', 85000000, '2026-08-15', 'open', 'Тараз', 'subcontract'),
    (p_client_taraz, '[Seed] Благоустройство двора ЖК «Алтын»', 'Асфальт 1200 м², озеленение, детская площадка.', 12500000, '2026-07-01', 'open', 'Тараз', 'subcontract'),
    (p_client_taraz, '[Seed] Закупка цемента М400 и газоблока', 'На 2 жилых дома, доставка на объект в Таразе.', 6800000, '2026-06-20', 'open', 'Тараз', 'materials'),
    (p_client_taraz, '[Seed] Доставка щебня 5–20 на объект', '200 м³, самосвалы, разгрузка.', 2450000, '2026-06-10', 'open', 'Тараз', 'logistics'),
    (p_client_taraz, '[Seed] Чистовая отделка офиса 85 м²', 'Центр Тараза, потолок Armstrong, ламинат.', 4900000, '2026-07-20', 'open', 'Тараз', 'subcontract'),
    (p_client, '[Seed] Монтаж VRV в ТРЦ «Хан Шатыр» (тех. зона)', 'Проект есть, нужен монтаж и пусконаладка.', 36000000, '2026-09-01', 'open', 'Астана', 'subcontract'),
    (p_client, '[Seed] Сэндвич-панели кровельные 100 мм', '1200 м², доставка на объект Алматы.', 18500000, '2026-06-25', 'open', 'Алматы', 'materials'),
    (p_client, '[Seed] Арматура A500C — 14 тонн', 'Резка 12/14 мм, доставка на стройплощадку.', 5300000, '2026-06-12', 'open', 'Алматы', 'logistics'),
    (p_client, '[Seed] Электромонтаж складского комплекса', 'Щиты, кабель-каналы, LED-освещение 4200 м².', 9400000, '2026-07-05', 'open', 'Алматы', 'subcontract'),
    (p_clientco, '[Seed] Ремонт фасада БЦ «Emerald»', 'Утепление 3500 м², облицовка композитом.', 43000000, '2026-08-30', 'open', 'Астана', 'subcontract'),
    (p_clientco, '[Seed] Керамогранит 600×600 — 820 м²', 'Поставка + доставка на объект.', 3700000, '2026-06-18', 'open', 'Астана', 'materials'),
    (p_client, '[Seed] Кровля производственного ангара 1480 м²', 'Металлочерепица, утепление, водосток.', 22500000, '2026-07-15', 'open', 'Шымкент', 'subcontract'),
    (p_client_taraz, '[Seed] Ландшафт частного участка 12 соток', 'Газон рулонный, автополив, брусчатка.', 2900000, '2026-06-28', 'open', 'Тараз', 'other'),
    (p_client, '[Seed] Вывоз строительного мусора', 'Контейнер 8 м³ × 12 рейсов, Алматы.', 920000, '2026-06-08', 'open', 'Алматы', 'logistics'),
    (p_clientco, '[Seed] СКУД и видеонаблюдение офис 900 м²', '16 камер, 3 турникета, монтаж под ключ.', 5600000, '2026-07-22', 'open', 'Астана', 'subcontract');

  -- =========================================================================
  -- 7. Портфолио
  -- =========================================================================
  INSERT INTO public.projects (company_id, title, description, completion_date) VALUES
    ((SELECT id FROM companies WHERE bin = '990001100001'), 'Коттедж 185 м², мкр. Ақ Orda', 'Коробка + кровля', '2025'),
    ((SELECT id FROM companies WHERE bin = '990001100001'), 'Реконструкция торгового зала', 'Supermarket 340 м²', '2024'),
    ((SELECT id FROM companies WHERE bin = '990001100002'), 'ЖК «Орталық»', 'Фасад 4100 м²', '2025'),
    ((SELECT id FROM companies WHERE bin = '990001100003'), 'Логистический хаб', 'Кровля 2050 м²', '2024'),
    ((SELECT id FROM companies WHERE bin = '990001100004'), 'Офисный центр на Достyk', 'Слаботочные сети', '2023');

  -- =========================================================================
  -- 8. Demo user_events (рекомендации)
  -- =========================================================================
  IF p_cont1 IS NOT NULL AND c_alatau IS NOT NULL THEN
    INSERT INTO public.user_events (profile_id, event_type, entity_type, entity_id, metadata) VALUES
      (p_cont1, 'view_company', 'company', c_alatau,
        '{"categories":["Генеральный подряд","Строительство"],"category":"Генеральный подряд","city":"Алматы","seed":"rich_demo"}'::jsonb),
      (p_cont1, 'view_company', 'company', (SELECT id FROM companies WHERE bin = '990001100004'),
        '{"categories":["Электромонтаж"],"category":"Электромонтаж","city":"Алматы","seed":"rich_demo"}'::jsonb),
      (p_cont1, 'view_tender', 'tender', (SELECT id FROM tenders WHERE title = '[Seed] Электромонтаж складского комплекса' LIMIT 1),
        '{"city":"Алматы","tender_type":"subcontract","seed":"rich_demo"}'::jsonb);
  END IF;

  IF p_cont3 IS NOT NULL THEN
    INSERT INTO public.user_events (profile_id, event_type, entity_type, entity_id, metadata) VALUES
      (p_cont3, 'view_company', 'company', (SELECT id FROM companies WHERE bin = '990001100001'),
        '{"categories":["Строительство"],"category":"Строительство","city":"Тараз","seed":"rich_demo"}'::jsonb),
      (p_cont3, 'view_tender', 'tender', (SELECT id FROM tenders WHERE title LIKE '[Seed] Закупка цемента%' LIMIT 1),
        '{"city":"Тараз","tender_type":"materials","seed":"rich_demo"}'::jsonb);
  END IF;

END $$;

-- Дозаполнить контакты у компаний без адреса (Demo Supply, старые прогоны seed)
UPDATE public.companies c SET
  address = v.addr,
  email = COALESCE(NULLIF(trim(c.email), ''), v.email),
  phone = COALESCE(NULLIF(trim(c.phone), ''), v.phone),
  bin = COALESCE(c.bin, v.bin),
  updated_at = now()
FROM (VALUES
  ('Demo Supply Алматы', 'ул. Райымбека 180, склад №1', 'warehouse-almaty@demo-supply.kz', '+77022000001', '990002020001'),
  ('Demo Supply Astana', 'пр. Туран 55, склад №2', 'warehouse-astana@demo-supply.kz', '+77022000002', '990002010001'),
  ('Demo Supply Shymkent', 'пр. Байdibek bi 78', 'warehouse-shymkent@demo-supply.kz', '+77022000003', '990002030001'),
  ('Demo Supply Karaganda', 'ул. Бухар жырау 52', 'warehouse-karaganda@demo-supply.kz', '+77022000004', '990002040001'),
  ('Demo Supply Aktobe', 'пр. Абая 14, база', 'warehouse-aktobe@demo-supply.kz', '+77022000005', '990002050001'),
  ('Demo Supply Almaty 2', 'ул. Жандосова 45, ангар 2', 'warehouse-almaty2@demo-supply.kz', '+77022000006', '990002020002')
) AS v(name, addr, email, phone, bin)
WHERE c.name = v.name
  AND (c.address IS NULL OR trim(c.address) = '');

-- У любых компаний без адреса — городской адрес по BIN или id (детерминированно)
UPDATE public.companies SET
  address = CASE city
    WHEN 'Астана' THEN 'пр. Кабанбай батыра ' || (10 + (abs(hashtext(coalesce(bin, id::text))) % 90))::text
    WHEN 'Алматы' THEN 'ул. Райымбека ' || (80 + (abs(hashtext(coalesce(bin, id::text))) % 120))::text
    WHEN 'Тараз' THEN 'ул. Толе би ' || (50 + (abs(hashtext(coalesce(bin, id::text))) % 100))::text
    WHEN 'Шымкент' THEN 'пр. Байdibek bi ' || (20 + (abs(hashtext(coalesce(bin, id::text))) % 80))::text
    WHEN 'Караганда' THEN 'ул. Бухар жырау ' || (30 + (abs(hashtext(coalesce(bin, id::text))) % 70))::text
    WHEN 'Актobe' THEN 'пр. Абая ' || (5 + (abs(hashtext(coalesce(bin, id::text))) % 60))::text
    ELSE 'г. ' || city || ', ул. Центральная ' || (1 + (abs(hashtext(id::text)) % 50))::text
  END,
  email = COALESCE(NULLIF(trim(email), ''), 'office@bc-' || substr(replace(id::text, '-', ''), 1, 12) || '.demo.kz'),
  phone = COALESCE(NULLIF(trim(phone), ''), '+7701' || lpad((abs(hashtext(id::text)) % 9999999)::text, 7, '0')),
  updated_at = now()
WHERE address IS NULL OR trim(coalesce(address, '')) = '';

-- Привязать базовые материалы seed_test_accounts к справочнику
UPDATE public.services s SET
  market_product_id = mp.id,
  price_unit = COALESCE(s.price_unit, mp.price_unit)
FROM public.market_products mp
WHERE s.category = 'Материалы'
  AND s.market_product_id IS NULL
  AND (
    (s.title ILIKE '%арматура a500%' AND mp.slug = 'armatura-a500c')
    OR (s.title ILIKE '%бетон%м300%' AND mp.slug = 'beton-m300')
    OR (s.title ILIKE '%газобетон%' AND mp.slug = 'gazobeton-d500')
  );

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'recompute_platform_price_aggregates') THEN
    PERFORM public.recompute_platform_price_aggregates();
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Сводка
-- -----------------------------------------------------------------------------
SELECT 'companies' AS metric, COUNT(*)::text AS value FROM public.companies
UNION ALL SELECT 'open_tenders', COUNT(*)::text FROM public.tenders WHERE status = 'open'
UNION ALL SELECT 'material_listings', COUNT(*)::text FROM public.services WHERE category = 'Материалы'
UNION ALL SELECT 'steppe_listings', COUNT(*)::text FROM public.services s
  JOIN public.companies c ON c.id = s.company_id WHERE c.name ILIKE '%Steppe Materials%'
UNION ALL SELECT 'price_insights (>=5)', COUNT(*)::text FROM public.listing_price_insights
UNION ALL SELECT 'aggregates >=5', COUNT(*)::text FROM public.platform_price_aggregates WHERE listing_count >= 5;

SELECT a.city, mp.name, a.listing_count, a.median_price
FROM public.platform_price_aggregates a
JOIN public.market_products mp ON mp.id = a.market_product_id
WHERE a.listing_count >= 5
ORDER BY a.city, mp.name
LIMIT 30;

SELECT email AS login, '123456' AS password, p.city, p.role::text
FROM auth.users u
JOIN public.profiles p ON p.user_id = u.id
WHERE u.email LIKE '%@test.com'
ORDER BY u.email;
