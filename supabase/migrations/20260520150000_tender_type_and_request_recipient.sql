-- Тип тендера (подряд / материалы / логистика / другое)
ALTER TABLE public.tenders
  ADD COLUMN IF NOT EXISTS tender_type text NOT NULL DEFAULT 'subcontract';

ALTER TABLE public.tenders
  DROP CONSTRAINT IF EXISTS tenders_tender_type_check;

ALTER TABLE public.tenders
  ADD CONSTRAINT tenders_tender_type_check
  CHECK (tender_type IN ('subcontract', 'materials', 'logistics', 'other'));

COMMENT ON COLUMN public.tenders.tender_type IS 'subcontract | materials | logistics | other';

-- Отклик на тендер без компании у автора: заявка напрямую владельцу профиля
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS recipient_profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.requests
  ALTER COLUMN company_id DROP NOT NULL;

ALTER TABLE public.requests
  DROP CONSTRAINT IF EXISTS requests_company_or_recipient_check;

ALTER TABLE public.requests
  ADD CONSTRAINT requests_company_or_recipient_check
  CHECK (
    (company_id IS NOT NULL AND recipient_profile_id IS NULL)
    OR (company_id IS NULL AND recipient_profile_id IS NOT NULL)
  );

COMMENT ON COLUMN public.requests.recipient_profile_id IS 'Получатель заявки, если у него нет компании (например отклик на тендер)';

-- RLS: участник = заказчик, владелец компании или получатель по профилю
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
  );

DROP POLICY IF EXISTS "Requests: participant delete" ON public.requests;
CREATE POLICY "Requests: participant delete" ON public.requests
  FOR DELETE USING (
    client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR recipient_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Messages: participant read" ON public.messages;
CREATE POLICY "Messages: participant read" ON public.messages
  FOR SELECT USING (
    request_id IN (
      SELECT r.id FROM public.requests r
      WHERE r.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR r.recipient_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR r.company_id IN (
           SELECT c.id FROM public.companies c
           JOIN public.profiles p ON c.owner_id = p.id
           WHERE p.user_id = auth.uid()
         )
    )
  );

DROP POLICY IF EXISTS "Messages: participant insert" ON public.messages;
CREATE POLICY "Messages: participant insert" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND request_id IN (
      SELECT r.id FROM public.requests r
      WHERE r.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR r.recipient_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR r.company_id IN (
           SELECT c.id FROM public.companies c
           JOIN public.profiles p ON c.owner_id = p.id
           WHERE p.user_id = auth.uid()
         )
    )
  );

DROP POLICY IF EXISTS "Messages: participant update" ON public.messages;
CREATE POLICY "Messages: participant update" ON public.messages
  FOR UPDATE USING (
    request_id IN (
      SELECT r.id FROM public.requests r
      WHERE r.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR r.recipient_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR r.company_id IN (
           SELECT c.id FROM public.companies c
           JOIN public.profiles p ON c.owner_id = p.id
           WHERE p.user_id = auth.uid()
         )
    )
  );

-- Уведомления: владелец компании или recipient_profile_id
CREATE OR REPLACE FUNCTION public.trg_notify_new_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_body text;
BEGIN
  IF NEW.recipient_profile_id IS NOT NULL THEN
    v_owner := NEW.recipient_profile_id;
  ELSE
    SELECT c.owner_id INTO v_owner
    FROM public.companies c
    WHERE c.id = NEW.company_id;
  END IF;

  IF v_owner IS NULL OR v_owner = NEW.client_id THEN
    RETURN NEW;
  END IF;

  v_body := left(trim(coalesce(NEW.title, '')), 200);
  IF coalesce(trim(NEW.description), '') <> '' THEN
    v_body := left(v_body || E'\n' || trim(NEW.description), 400);
  END IF;

  INSERT INTO public.notifications (recipient_id, request_id, type, title, body, link)
  VALUES (
    v_owner,
    NEW.id,
    'new_request',
    'Новая заявка',
    nullif(v_body, ''),
    '/chat/' || NEW.id::text
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client uuid;
  v_owner uuid;
  v_target uuid;
  v_msg_count int;
BEGIN
  SELECT r.client_id, COALESCE(c.owner_id, r.recipient_profile_id)
  INTO v_client, v_owner
  FROM public.requests r
  LEFT JOIN public.companies c ON c.id = r.company_id
  WHERE r.id = NEW.request_id;

  IF v_client IS NULL OR v_owner IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_id = v_client THEN
    v_target := v_owner;
  ELSE
    v_target := v_client;
  END IF;

  IF v_target IS NULL OR v_target = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  SELECT count(*)::int INTO v_msg_count
  FROM public.messages
  WHERE request_id = NEW.request_id;

  IF v_msg_count > 1 THEN
    INSERT INTO public.notifications (recipient_id, request_id, type, title, body, link)
    VALUES (
      v_target,
      NEW.request_id,
      'new_message',
      'Новое сообщение',
      left(trim(NEW.content), 200),
      '/chat/' || NEW.request_id::text
    );
  END IF;

  RETURN NEW;
END;
$$;
