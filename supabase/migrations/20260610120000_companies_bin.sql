-- БИН компании (12 цифр), опционально до верификации
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS bin text;

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_bin_format_check;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_bin_format_check
  CHECK (bin IS NULL OR bin ~ '^\d{12}$');

COMMENT ON COLUMN public.companies.bin IS 'Business identification number (KZ), 12 digits';
