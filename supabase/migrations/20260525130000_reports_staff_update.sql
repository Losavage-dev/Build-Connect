GRANT UPDATE ON public.reports TO authenticated;

DROP POLICY IF EXISTS "Reports: staff update" ON public.reports;
CREATE POLICY "Reports: staff update" ON public.reports
  FOR UPDATE USING (public.is_moderator_or_admin())
  WITH CHECK (public.is_moderator_or_admin());
