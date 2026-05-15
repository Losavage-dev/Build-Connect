-- Группа материала (категория витрины: металл, бетон и т.д.)
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS material_group text;

COMMENT ON COLUMN public.services.material_group IS 'Группа материала в каталоге (при category = Материалы)';
