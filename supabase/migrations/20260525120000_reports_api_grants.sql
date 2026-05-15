-- Таблица reports создана после api_grants — без GRANT INSERT падал с permission denied
GRANT SELECT, INSERT ON public.reports TO authenticated;

-- Модераторы видят все жалобы (для ручной проверки в Dashboard / будущий UI)
DROP POLICY IF EXISTS "Reports: staff read all" ON public.reports;
CREATE POLICY "Reports: staff read all" ON public.reports
  FOR SELECT USING (public.is_moderator_or_admin());
