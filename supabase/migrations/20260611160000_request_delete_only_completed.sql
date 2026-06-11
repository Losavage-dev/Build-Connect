-- Удаление заявки: только после завершения сделки (status = completed).

DROP POLICY IF EXISTS "Requests: participant delete" ON public.requests;

CREATE POLICY "Requests: participant delete" ON public.requests
  FOR DELETE USING (
    status = 'completed'
    AND (
      client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR recipient_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR company_id IN (
        SELECT c.id FROM public.companies c
        JOIN public.profiles p ON c.owner_id = p.id
        WHERE p.user_id = auth.uid()
      )
    )
  );

COMMENT ON POLICY "Requests: participant delete" ON public.requests IS
  'Участник может удалить заявку только со статусом completed.';
