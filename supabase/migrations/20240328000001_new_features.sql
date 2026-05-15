-- Add youtube_url to companies
ALTER TABLE public.companies ADD COLUMN youtube_url text;

-- Create Tenders Table
CREATE TABLE public.tenders (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    budget numeric,
    deadline date,
    status text NOT NULL DEFAULT 'open', -- 'open', 'closed', 'in_progress'
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create Services Table
CREATE TABLE public.services (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    price numeric NOT NULL,
    category text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Allow all for local development)
CREATE POLICY "Enable all actions for everyone" ON public.tenders FOR ALL USING (true);
CREATE POLICY "Enable all actions for everyone" ON public.services FOR ALL USING (true);

-- Realtime Setup for Messages
-- In Supabase, you must enable REPLICA IDENTITY FULL to send old copies with updates/deletes, 
-- and then add the table to the supabase_realtime publication
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Check if publication exists, if so add table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END
$$;
