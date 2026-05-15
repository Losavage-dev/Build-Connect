-- Категории ролика (о каких направлениях видео) + in-app уведомления + триггер на новые сообщения

-- 1) Категории для поста витрины
CREATE TABLE IF NOT EXISTS public.company_promo_post_categories (
  post_id uuid NOT NULL REFERENCES public.company_promo_posts(id) ON DELETE CASCADE,
  category text NOT NULL,
  PRIMARY KEY (post_id, category)
);

CREATE INDEX IF NOT EXISTS company_promo_post_categories_category_idx
  ON public.company_promo_post_categories(category);

ALTER TABLE public.company_promo_post_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promo post categories: public read" ON public.company_promo_post_categories
  FOR SELECT USING (true);

CREATE POLICY "Promo post categories: owner manage" ON public.company_promo_post_categories
  FOR ALL USING (
    post_id IN (
      SELECT p.id FROM public.company_promo_posts p
      JOIN public.companies c ON c.id = p.company_id
      JOIN public.profiles pr ON pr.id = c.owner_id
      WHERE pr.user_id = auth.uid()
    )
  );

GRANT SELECT ON public.company_promo_post_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.company_promo_post_categories TO authenticated;

-- 2) Уведомления (получатель = profiles.id)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx
  ON public.notifications(recipient_id)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS notifications_request_idx ON public.notifications(request_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications: recipient read" ON public.notifications
  FOR SELECT USING (
    recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Notifications: recipient update" ON public.notifications
  FOR UPDATE USING (
    recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

GRANT SELECT, UPDATE ON public.notifications TO authenticated;

-- 3) Триггер: новое сообщение в заявке → уведомление второй стороне (SECURITY DEFINER обходит RLS при INSERT)
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

  IF v_target IS NOT NULL AND v_target <> NEW.sender_id THEN
    INSERT INTO public.notifications (recipient_id, request_id, type, title, body, link)
    VALUES (
      v_target,
      NEW.request_id,
      'new_message',
      'Новое сообщение',
      left(NEW.content, 200),
      '/chat/' || NEW.request_id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_notify ON public.messages;
CREATE TRIGGER trg_messages_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_notify_new_message();

-- Включите Realtime для таблицы notifications в Dashboard: Database → Replication,
-- либо выполните (один раз): ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
