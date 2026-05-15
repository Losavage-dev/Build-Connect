-- После «снять проверено» компания остаётся в каталоге (без бейджа), но не как черновик/скрытая
CREATE OR REPLACE FUNCTION public.is_company_publicly_visible(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = p_company_id
      AND (
        c.verification_status::text IN ('verified', 'revoked')
        OR c.owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        OR public.is_moderator_or_admin()
      )
  );
$$;
