-- Карточка компании на проверке (pending): видна любому авторизованному пользователю,
-- чтобы можно было открыть ссылку и отправить жалобу (сценарий защиты диплома и реальная модерация).
-- Черновик (draft) и отклонённые (rejected) по-прежнему только владелец + модератор.

DROP POLICY IF EXISTS "Companies: public read verified" ON public.companies;
CREATE POLICY "Companies: public read verified" ON public.companies
  FOR SELECT USING (
    verification_status = 'verified'
    OR (
      verification_status::text = 'pending'
      AND auth.uid() IS NOT NULL
    )
    OR owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR public.is_moderator_or_admin()
  );

COMMENT ON POLICY "Companies: public read verified" ON public.companies IS
  'Каталог на фронте фильтрует verified; pending доступен по прямой ссылке для авторизованных (жалобы, просмотр на модерации).';
