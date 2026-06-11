-- Edge Function send-notification-email uses service_role to read/update the queue.
-- Table was created with RLS but without table-level grants for service_role.

GRANT SELECT, UPDATE ON public.email_outbox TO service_role;
