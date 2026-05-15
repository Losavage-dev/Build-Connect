-- Уведомление владельцу о новой заявке + без дубля «новое сообщение» на первом сообщении от заказчика

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
  SELECT c.owner_id INTO v_owner
  FROM public.companies c
  WHERE c.id = NEW.company_id;

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

DROP TRIGGER IF EXISTS trg_requests_notify ON public.requests;
CREATE TRIGGER trg_requests_notify
  AFTER INSERT ON public.requests
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_notify_new_request();

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
  SELECT r.client_id, c.owner_id
  INTO v_client, v_owner
  FROM public.requests r
  JOIN public.companies c ON c.id = r.company_id
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

  IF v_msg_count <= 1 AND NEW.sender_id = v_client THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (recipient_id, request_id, type, title, body, link)
  VALUES (
    v_target,
    NEW.request_id,
    'new_message',
    'Новое сообщение',
    left(NEW.content, 200),
    '/chat/' || NEW.request_id::text
  );

  RETURN NEW;
END;
$$;
