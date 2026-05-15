-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Enums
CREATE TYPE public.user_role AS ENUM ('client', 'contractor', 'supplier');
CREATE TYPE public.company_member_role AS ENUM ('admin', 'member');
CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'rejected', 'completed');

-- Create Tables
CREATE TABLE public.profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    first_name text,
    last_name text,
    phone text,
    city text,
    avatar_url text,
    role public.user_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.companies (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text NOT NULL,
    city text NOT NULL,
    description text,
    phone text,
    email text,
    website text,
    address text,
    logo_url text,
    is_verified boolean DEFAULT false,
    rating numeric(3,2),
    review_count integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.company_members (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.company_member_role NOT NULL DEFAULT 'member',
    joined_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.company_services (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price_from numeric,
    price_to numeric,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.projects (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    completion_date text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.project_images (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    caption text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.requests (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    status public.request_status NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS Enablement
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Setup Basic RLS Policies (Allow all for local environment to ensure smooth testing, adjust for prod)
CREATE POLICY "Enable all actions for everyone" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Enable all actions for everyone" ON public.companies FOR ALL USING (true);
CREATE POLICY "Enable all actions for everyone" ON public.company_members FOR ALL USING (true);
CREATE POLICY "Enable all actions for everyone" ON public.company_services FOR ALL USING (true);
CREATE POLICY "Enable all actions for everyone" ON public.projects FOR ALL USING (true);
CREATE POLICY "Enable all actions for everyone" ON public.project_images FOR ALL USING (true);
CREATE POLICY "Enable all actions for everyone" ON public.requests FOR ALL USING (true);
CREATE POLICY "Enable all actions for everyone" ON public.messages FOR ALL USING (true);
CREATE POLICY "Enable all actions for everyone" ON public.reviews FOR ALL USING (true);

-- Functions requested in types.ts
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS uuid AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_company_admin(p_company_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members 
    JOIN public.profiles ON company_members.user_id = profiles.id
    WHERE company_members.company_id = p_company_id 
      AND profiles.user_id = auth.uid() 
      AND company_members.role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_company_member(p_company_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members 
    JOIN public.profiles ON company_members.user_id = profiles.id
    WHERE company_members.company_id = p_company_id 
      AND profiles.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;
