-- Migration: Production-grade RLS policies
-- Replaces the "Allow All" policies with proper access control

-- ============================================================
-- 1. DROP all old "Allow All" policies
-- ============================================================
DROP POLICY IF EXISTS "Enable all actions for everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable all actions for everyone" ON public.companies;
DROP POLICY IF EXISTS "Enable all actions for everyone" ON public.company_members;
DROP POLICY IF EXISTS "Enable all actions for everyone" ON public.company_services;
DROP POLICY IF EXISTS "Enable all actions for everyone" ON public.projects;
DROP POLICY IF EXISTS "Enable all actions for everyone" ON public.project_images;
DROP POLICY IF EXISTS "Enable all actions for everyone" ON public.requests;
DROP POLICY IF EXISTS "Enable all actions for everyone" ON public.messages;
DROP POLICY IF EXISTS "Enable all actions for everyone" ON public.reviews;
DROP POLICY IF EXISTS "Enable all actions for everyone" ON public.tenders;
DROP POLICY IF EXISTS "Enable all actions for everyone" ON public.services;

-- ============================================================
-- 2. PROFILES
-- ============================================================
-- Anyone can read profiles (needed for chat names, review authors)
CREATE POLICY "Profiles: public read" ON public.profiles
  FOR SELECT USING (true);

-- Users can update only their own profile
CREATE POLICY "Profiles: owner update" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Insert handled by trigger (handle_new_user), allow system insert
CREATE POLICY "Profiles: system insert" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 3. COMPANIES
-- ============================================================
CREATE POLICY "Companies: public read" ON public.companies
  FOR SELECT USING (true);

CREATE POLICY "Companies: owner insert" ON public.companies
  FOR INSERT WITH CHECK (
    owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Companies: owner update" ON public.companies
  FOR UPDATE USING (
    owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Companies: owner delete" ON public.companies
  FOR DELETE USING (
    owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- ============================================================
-- 4. COMPANY_MEMBERS
-- ============================================================
CREATE POLICY "Company members: public read" ON public.company_members
  FOR SELECT USING (true);

CREATE POLICY "Company members: company owner manage" ON public.company_members
  FOR ALL USING (
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. COMPANY_SERVICES
-- ============================================================
CREATE POLICY "Company services: public read" ON public.company_services
  FOR SELECT USING (true);

CREATE POLICY "Company services: owner manage" ON public.company_services
  FOR ALL USING (
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. PROJECTS
-- ============================================================
CREATE POLICY "Projects: public read" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "Projects: owner manage" ON public.projects
  FOR ALL USING (
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. PROJECT_IMAGES
-- ============================================================
CREATE POLICY "Project images: public read" ON public.project_images
  FOR SELECT USING (true);

CREATE POLICY "Project images: owner manage" ON public.project_images
  FOR ALL USING (
    project_id IN (
      SELECT pr.id FROM public.projects pr
      JOIN public.companies c ON pr.company_id = c.id
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================
-- 8. REQUESTS
-- ============================================================
-- Read: only the client who created OR the company owner
CREATE POLICY "Requests: participant read" ON public.requests
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Insert: any authenticated user can create a request
CREATE POLICY "Requests: auth insert" ON public.requests
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Update: both parties can update (e.g. change status)
CREATE POLICY "Requests: participant update" ON public.requests
  FOR UPDATE USING (
    client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Delete: only the client who created it
CREATE POLICY "Requests: client delete" ON public.requests
  FOR DELETE USING (
    client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- ============================================================
-- 9. MESSAGES
-- ============================================================
-- Read: only participants of the request
CREATE POLICY "Messages: participant read" ON public.messages
  FOR SELECT USING (
    request_id IN (
      SELECT r.id FROM public.requests r
      WHERE r.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR r.company_id IN (
           SELECT c.id FROM public.companies c
           JOIN public.profiles p ON c.owner_id = p.id
           WHERE p.user_id = auth.uid()
         )
    )
  );

-- Insert: only participants
CREATE POLICY "Messages: participant insert" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND request_id IN (
      SELECT r.id FROM public.requests r
      WHERE r.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR r.company_id IN (
           SELECT c.id FROM public.companies c
           JOIN public.profiles p ON c.owner_id = p.id
           WHERE p.user_id = auth.uid()
         )
    )
  );

-- Update: for marking as read
CREATE POLICY "Messages: participant update" ON public.messages
  FOR UPDATE USING (
    request_id IN (
      SELECT r.id FROM public.requests r
      WHERE r.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR r.company_id IN (
           SELECT c.id FROM public.companies c
           JOIN public.profiles p ON c.owner_id = p.id
           WHERE p.user_id = auth.uid()
         )
    )
  );

-- ============================================================
-- 10. REVIEWS
-- ============================================================
CREATE POLICY "Reviews: public read" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Reviews: auth insert" ON public.reviews
  FOR INSERT WITH CHECK (
    author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Reviews: author delete" ON public.reviews
  FOR DELETE USING (
    author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- ============================================================
-- 11. TENDERS
-- ============================================================
CREATE POLICY "Tenders: public read" ON public.tenders
  FOR SELECT USING (true);

CREATE POLICY "Tenders: auth insert" ON public.tenders
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Tenders: owner update" ON public.tenders
  FOR UPDATE USING (
    client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Tenders: owner delete" ON public.tenders
  FOR DELETE USING (
    client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- ============================================================
-- 12. SERVICES
-- ============================================================
CREATE POLICY "Services: public read" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "Services: company owner insert" ON public.services
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Services: company owner update" ON public.services
  FOR UPDATE USING (
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Services: company owner delete" ON public.services
  FOR DELETE USING (
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
