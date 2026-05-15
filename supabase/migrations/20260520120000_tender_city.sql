-- Город выполнения работ по тендеру (для фильтра и карточки)
ALTER TABLE public.tenders
  ADD COLUMN IF NOT EXISTS city text;

COMMENT ON COLUMN public.tenders.city IS 'Город, в котором нужно выполнить работы по тендеру';
