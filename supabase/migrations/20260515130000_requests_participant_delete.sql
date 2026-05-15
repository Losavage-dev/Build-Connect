-- Удаление заявки: и заказчик, и владелец компании (как для UPDATE)

DROP POLICY IF EXISTS "Requests: client delete" ON public.requests;

CREATE POLICY "Requests: participant delete" ON public.requests
  FOR DELETE USING (
    client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
