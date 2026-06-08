-- Отзывы на пользователей (партнёры по сделке) + рейтинг профиля + очередь email

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_rating numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_review_count integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.user_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_reviews_not_self CHECK (subject_id <> author_id),
  CONSTRAINT unique_user_review_per_request_author UNIQUE (request_id, author_id)
);

CREATE INDEX IF NOT EXISTS user_reviews_subject_idx
  ON public.user_reviews (subject_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_reviews_request_idx
  ON public.user_reviews (request_id);

ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.requests_share_completed_deal(
  p_request_id uuid,
  p_author uuid,
  p_subject uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.requests r
    LEFT JOIN public.companies c ON c.id = r.company_id
    WHERE r.id = p_request_id
      AND r.status = 'completed'
      AND p_author IS DISTINCT FROM p_subject
      AND (
        (r.client_id = p_author AND (r.recipient_profile_id = p_subject OR c.owner_id = p_subject))
        OR (r.client_id = p_subject AND (r.recipient_profile_id = p_author OR c.owner_id = p_author))
      )
  );
$$;

DROP POLICY IF EXISTS "User reviews: public read" ON public.user_reviews;
CREATE POLICY "User reviews: public read" ON public.user_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "User reviews: participant insert" ON public.user_reviews;
CREATE POLICY "User reviews: participant insert" ON public.user_reviews
  FOR INSERT WITH CHECK (
    author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND public.requests_share_completed_deal(request_id, author_id, subject_id)
  );

GRANT SELECT ON public.user_reviews TO anon, authenticated;
GRANT INSERT ON public.user_reviews TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_profile_user_review_stats(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_avg numeric;
BEGIN
  SELECT count(*)::int, avg(rating)::numeric
  INTO v_count, v_avg
  FROM public.user_reviews
  WHERE subject_id = p_profile_id;

  UPDATE public.profiles
  SET
    user_review_count = COALESCE(v_count, 0),
    user_rating = CASE WHEN COALESCE(v_count, 0) > 0 THEN round(v_avg, 1) ELSE 0 END,
    updated_at = now()
  WHERE id = p_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_profile_user_review_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_profile_user_review_stats(OLD.subject_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.subject_id IS DISTINCT FROM NEW.subject_id THEN
    PERFORM public.sync_profile_user_review_stats(OLD.subject_id);
  END IF;

  PERFORM public.sync_profile_user_review_stats(NEW.subject_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_reviews_sync_profile_stats ON public.user_reviews;
CREATE TRIGGER trg_user_reviews_sync_profile_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.user_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_profile_user_review_stats();

-- Уведомление исполнителю при завершении заявки заказчиком
CREATE OR REPLACE FUNCTION public.trg_notify_request_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target uuid;
  v_owner uuid;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM 'completed'
  THEN
    SELECT c.owner_id INTO v_owner
    FROM public.companies c
    WHERE c.id = NEW.company_id;

    v_target := COALESCE(NEW.recipient_profile_id, v_owner);

    IF v_target IS NOT NULL AND v_target <> NEW.client_id THEN
      INSERT INTO public.notifications (recipient_id, request_id, type, title, body, link)
      VALUES (
        v_target,
        NEW.id,
        'request_completed',
        'Заявка завершена',
        'Заказчик подтвердил выполнение. Оставьте отзыв о партнёре по сделке.',
        '/chat/' || NEW.id::text
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_requests_notify_completed ON public.requests;
CREATE TRIGGER trg_requests_notify_completed
  AFTER UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_request_completed();

-- Очередь email (обрабатывается Edge Function + Resend)
CREATE TABLE IF NOT EXISTS public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body_text text,
  link text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS email_outbox_pending_idx
  ON public.email_outbox (created_at)
  WHERE status = 'pending';

ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.trg_enqueue_notification_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT u.email INTO v_email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.id = NEW.recipient_id;

  IF v_email IS NOT NULL AND btrim(v_email) <> '' THEN
    INSERT INTO public.email_outbox (notification_id, recipient_email, subject, body_text, link)
    VALUES (
      NEW.id,
      v_email,
      NEW.title,
      COALESCE(NEW.body, ''),
      NEW.link
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notifications_enqueue_email ON public.notifications;
CREATE TRIGGER trg_notifications_enqueue_email
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_enqueue_notification_email();

COMMENT ON TABLE public.user_reviews IS 'Отзывы партнёров по завершённой заявке (публичный профиль пользователя)';
COMMENT ON TABLE public.email_outbox IS 'Очередь email-уведомлений; отправка через Edge Function send-notification-email';
