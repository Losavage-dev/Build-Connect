-- Связь заявки-отклика с тендером (CRM откликов для автора)
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS source_tender_id uuid REFERENCES public.tenders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_requests_source_tender_id ON public.requests(source_tender_id)
  WHERE source_tender_id IS NOT NULL;

COMMENT ON COLUMN public.requests.source_tender_id IS 'Тендер, на который отправлен отклик (если заявка создана из раздела тендеров)';

-- Автор тендера видит отклики на свои тендеры
DROP POLICY IF EXISTS "Requests: participant read" ON public.requests;
CREATE POLICY "Requests: participant read" ON public.requests
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR recipient_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
    OR source_tender_id IN (
      SELECT t.id FROM public.tenders t
      JOIN public.profiles p ON t.client_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Requests: participant update" ON public.requests;
CREATE POLICY "Requests: participant update" ON public.requests
  FOR UPDATE USING (
    client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR recipient_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
    OR source_tender_id IN (
      SELECT t.id FROM public.tenders t
      JOIN public.profiles p ON t.client_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
