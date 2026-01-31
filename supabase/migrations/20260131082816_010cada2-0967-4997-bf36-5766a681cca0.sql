-- Enum types
CREATE TYPE public.user_role AS ENUM ('client', 'contractor', 'supplier');
CREATE TYPE public.company_member_role AS ENUM ('admin', 'member');
CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'rejected', 'completed');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'client',
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Company services
CREATE TABLE public.company_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_from NUMERIC,
  price_to NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Company members
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role company_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

-- Projects / Portfolio
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completion_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project images
CREATE TABLE public.project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Requests (from clients to companies)
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages (chat between client and company)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is company admin
CREATE OR REPLACE FUNCTION public.is_company_admin(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members cm
    JOIN public.profiles p ON cm.user_id = p.id
    WHERE cm.company_id = p_company_id
      AND p.user_id = auth.uid()
      AND cm.role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.companies c
    JOIN public.profiles p ON c.owner_id = p.id
    WHERE c.id = p_company_id
      AND p.user_id = auth.uid()
  );
$$;

-- Helper function: Check if user is company member
CREATE OR REPLACE FUNCTION public.is_company_member(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members cm
    JOIN public.profiles p ON cm.user_id = p.id
    WHERE cm.company_id = p_company_id
      AND p.user_id = auth.uid()
  ) OR public.is_company_admin(p_company_id);
$$;

-- Helper function: Get current user's profile id
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Trigger function for updating company rating
CREATE OR REPLACE FUNCTION public.update_company_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.companies
  SET 
    rating = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE company_id = COALESCE(NEW.company_id, OLD.company_id)),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE company_id = COALESCE(NEW.company_id, OLD.company_id))
  WHERE id = COALESCE(NEW.company_id, OLD.company_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_company_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_company_rating();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER requests_updated_at BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for companies
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create companies" ON public.companies FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND owner_id = public.get_current_profile_id()
);
CREATE POLICY "Company owners can update" ON public.companies FOR UPDATE USING (public.is_company_admin(id));
CREATE POLICY "Company owners can delete" ON public.companies FOR DELETE USING (public.is_company_admin(id));

-- RLS Policies for company_services
CREATE POLICY "Anyone can view services" ON public.company_services FOR SELECT USING (true);
CREATE POLICY "Company admins can manage services" ON public.company_services FOR INSERT WITH CHECK (public.is_company_admin(company_id));
CREATE POLICY "Company admins can update services" ON public.company_services FOR UPDATE USING (public.is_company_admin(company_id));
CREATE POLICY "Company admins can delete services" ON public.company_services FOR DELETE USING (public.is_company_admin(company_id));

-- RLS Policies for company_members
CREATE POLICY "Members can view their company members" ON public.company_members FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Admins can add members" ON public.company_members FOR INSERT WITH CHECK (public.is_company_admin(company_id));
CREATE POLICY "Admins can update members" ON public.company_members FOR UPDATE USING (public.is_company_admin(company_id));
CREATE POLICY "Admins can remove members" ON public.company_members FOR DELETE USING (public.is_company_admin(company_id));

-- RLS Policies for projects
CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Company admins can create projects" ON public.projects FOR INSERT WITH CHECK (public.is_company_admin(company_id));
CREATE POLICY "Company admins can update projects" ON public.projects FOR UPDATE USING (public.is_company_admin(company_id));
CREATE POLICY "Company admins can delete projects" ON public.projects FOR DELETE USING (public.is_company_admin(company_id));

-- RLS Policies for project_images
CREATE POLICY "Anyone can view project images" ON public.project_images FOR SELECT USING (true);
CREATE POLICY "Company admins can manage images" ON public.project_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_company_admin(p.company_id))
);
CREATE POLICY "Company admins can update images" ON public.project_images FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_company_admin(p.company_id))
);
CREATE POLICY "Company admins can delete images" ON public.project_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_company_admin(p.company_id))
);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND author_id = public.get_current_profile_id()
);
CREATE POLICY "Authors can update own reviews" ON public.reviews FOR UPDATE USING (author_id = public.get_current_profile_id());
CREATE POLICY "Authors can delete own reviews" ON public.reviews FOR DELETE USING (author_id = public.get_current_profile_id());

-- RLS Policies for requests
CREATE POLICY "Clients and company owners can view requests" ON public.requests FOR SELECT USING (
  client_id = public.get_current_profile_id() OR public.is_company_member(company_id)
);
CREATE POLICY "Clients can create requests" ON public.requests FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND client_id = public.get_current_profile_id()
);
CREATE POLICY "Request participants can update" ON public.requests FOR UPDATE USING (
  client_id = public.get_current_profile_id() OR public.is_company_admin(company_id)
);

-- RLS Policies for messages
CREATE POLICY "Request participants can view messages" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.requests r
    WHERE r.id = request_id
    AND (r.client_id = public.get_current_profile_id() OR public.is_company_member(r.company_id))
  )
);
CREATE POLICY "Request participants can send messages" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.requests r
    WHERE r.id = request_id
    AND (r.client_id = public.get_current_profile_id() OR public.is_company_member(r.company_id))
  ) AND sender_id = public.get_current_profile_id()
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public) VALUES ('project-images', 'project-images', true);

-- Storage policies
CREATE POLICY "Anyone can view project images" ON storage.objects FOR SELECT USING (bucket_id = 'project-images');
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own images" ON storage.objects FOR UPDATE USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own images" ON storage.objects FOR DELETE USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Indexes for performance
CREATE INDEX idx_companies_city ON public.companies(city);
CREATE INDEX idx_companies_category ON public.companies(category);
CREATE INDEX idx_companies_rating ON public.companies(rating DESC);
CREATE INDEX idx_reviews_company ON public.reviews(company_id);
CREATE INDEX idx_requests_client ON public.requests(client_id);
CREATE INDEX idx_requests_company ON public.requests(company_id);
CREATE INDEX idx_messages_request ON public.messages(request_id);