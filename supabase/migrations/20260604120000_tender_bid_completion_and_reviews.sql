-- Отклик на тендер: завершать и оставлять отзыв может автор тендера (recipient), не подрядчик-initiator.

CREATE OR REPLACE FUNCTION public.enforce_request_completed_by_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM 'completed'
  THEN
    IF auth.uid() IS NOT NULL AND NOT (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = NEW.client_id AND p.user_id = auth.uid()
      )
      OR (
        NEW.source_tender_id IS NOT NULL
        AND NEW.recipient_profile_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = NEW.recipient_profile_id AND p.user_id = auth.uid()
        )
      )
    ) THEN
      RAISE EXCEPTION 'Завершить заявку может только заказчик (автор заявки или автор тендера).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Отзыв после завершённой заявки: заказчик каталога или автор тендера для отклика
DROP POLICY IF EXISTS "Reviews: auth insert after completed request" ON public.reviews;
CREATE POLICY "Reviews: auth insert after completed request" ON public.reviews
  FOR INSERT WITH CHECK (
    author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.requests r
      WHERE r.company_id = company_id
        AND r.status = 'completed'
        AND (
          r.client_id = author_id
          OR (
            r.source_tender_id IS NOT NULL
            AND r.recipient_profile_id = author_id
          )
        )
    )
  );
