-- Несколько категорий на компанию + ограничение частоты смены роли профиля

-- 1) Связь компания ↔ категории (основная категория остаётся в companies.category для совместимости)
CREATE TABLE IF NOT EXISTS public.company_categories (
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category text NOT NULL,
  PRIMARY KEY (company_id, category)
);

CREATE INDEX IF NOT EXISTS company_categories_category_idx ON public.company_categories(category);

ALTER TABLE public.company_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company categories: public read" ON public.company_categories
  FOR SELECT USING (true);

CREATE POLICY "Company categories: owner manage" ON public.company_categories
  FOR ALL USING (
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Заполнить из существующего поля category
INSERT INTO public.company_categories (company_id, category)
SELECT id, category FROM public.companies
WHERE category IS NOT NULL AND trim(category) <> ''
ON CONFLICT DO NOTHING;

-- 2) Профиль: метка последней смены роли (триггер не чаще 14 дней)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_role_change_at timestamptz;

CREATE OR REPLACE FUNCTION public.enforce_profile_role_change_rate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    IF OLD.last_role_change_at IS NOT NULL
       AND OLD.last_role_change_at > (now() - interval '14 days') THEN
      RAISE EXCEPTION 'Смена роли доступна не чаще одного раза в 14 дней. При необходимости срочной правки обратитесь в поддержку.';
    END IF;
    NEW.last_role_change_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_role_change ON public.profiles;
CREATE TRIGGER trg_profiles_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_profile_role_change_rate();

GRANT SELECT ON public.company_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.company_categories TO authenticated;
