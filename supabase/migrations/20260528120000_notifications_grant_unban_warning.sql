-- Модератор может вставлять уведомления (раньше был только SELECT/UPDATE)
GRANT INSERT ON public.notifications TO authenticated;

DROP POLICY IF EXISTS "Notifications: staff insert moderation" ON public.notifications;
CREATE POLICY "Notifications: staff insert moderation" ON public.notifications
  FOR INSERT WITH CHECK (public.is_moderator_or_admin());

CREATE OR REPLACE FUNCTION public.moderator_clear_profile_ban(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_moderator_or_admin() THEN
    RAISE EXCEPTION 'Недостаточно прав';
  END IF;
  UPDATE public.profiles
  SET banned_until = NULL, ban_reason = NULL
  WHERE id = p_profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.moderator_clear_profile_ban(uuid) TO authenticated;

ALTER TABLE public.moderation_actions DROP CONSTRAINT IF EXISTS moderation_actions_action_type_check;
ALTER TABLE public.moderation_actions ADD CONSTRAINT moderation_actions_action_type_check
  CHECK (action_type IN (
    'company_suspend',
    'company_restore',
    'company_revoke_verified',
    'tender_close',
    'profile_ban',
    'profile_unban',
    'owner_warning',
    'report_status_change'
  ));
