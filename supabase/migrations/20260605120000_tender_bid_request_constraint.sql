-- Отклик на тендер: company_id (подрядчик) + recipient_profile_id (автор тендера)

ALTER TABLE public.requests
  DROP CONSTRAINT IF EXISTS requests_company_or_recipient_check;

ALTER TABLE public.requests
  ADD CONSTRAINT requests_company_or_recipient_check
  CHECK (
    (
      source_tender_id IS NOT NULL
      AND company_id IS NOT NULL
      AND recipient_profile_id IS NOT NULL
    )
    OR (company_id IS NOT NULL AND recipient_profile_id IS NULL)
    OR (company_id IS NULL AND recipient_profile_id IS NOT NULL)
  );

COMMENT ON CONSTRAINT requests_company_or_recipient_check ON public.requests IS
  'Каталог/витрина: company XOR recipient; отклик на тендер: оба поля + source_tender_id';
