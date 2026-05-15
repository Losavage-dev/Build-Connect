-- Жалобы, инициированные модератором (отображаются в очереди с пометкой)
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS initiated_by_staff boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.reports.initiated_by_staff IS 'true — жалоба подана с роли модератора/админа';
