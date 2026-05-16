-- Завершение заявки (приёмка) — только со стороны заказчика (client_id).
-- RLS ранее разрешал обновление и владельцу company_id; UI тоже показывал кнопку всем участникам.

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
    -- С сессией JWT должен совпадать заказчик; без auth.uid() (сервисные/миграционные) — не блокируем.
    IF auth.uid() IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = NEW.client_id AND p.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Завершить заявку может только заказчик.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_requests_completed_by_client ON public.requests;
CREATE TRIGGER trg_requests_completed_by_client
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_request_completed_by_client();

COMMENT ON FUNCTION public.enforce_request_completed_by_client() IS
  'Статус completed может выставить при обновлении только профиль-заказчик заявки (client_id).';
