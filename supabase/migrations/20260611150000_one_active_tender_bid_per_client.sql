-- Один активный отклик (pending/accepted) на тендер от одного пользователя.
CREATE UNIQUE INDEX IF NOT EXISTS requests_one_active_bid_per_tender_client
  ON public.requests (source_tender_id, client_id)
  WHERE source_tender_id IS NOT NULL
    AND status IN ('pending', 'accepted');

COMMENT ON INDEX public.requests_one_active_bid_per_tender_client IS
  'Не более одного активного отклика на тендер от одного профиля (исполнителя).';
