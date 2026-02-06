
-- 1. Fix company creation: enforce role check in RLS policy
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;
CREATE POLICY "Contractors and suppliers can create companies"
  ON public.companies FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND owner_id = public.get_current_profile_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = public.get_current_profile_id()
      AND role IN ('contractor', 'supplier')
    )
  );

-- 2. Prevent review spam: one review per user per company
ALTER TABLE public.reviews
  ADD CONSTRAINT unique_review_per_user_company
  UNIQUE (company_id, author_id);

-- 3. Add server-side validation for request title
CREATE OR REPLACE FUNCTION public.validate_request_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF length(trim(NEW.title)) < 3 THEN
    RAISE EXCEPTION 'Title must be at least 3 characters';
  END IF;
  IF length(NEW.title) > 200 THEN
    RAISE EXCEPTION 'Title must be less than 200 characters';
  END IF;
  NEW.title = trim(NEW.title);
  IF NEW.description IS NOT NULL THEN
    NEW.description = trim(NEW.description);
    IF length(NEW.description) > 2000 THEN
      RAISE EXCEPTION 'Description must be less than 2000 characters';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_request_fields_trigger
  BEFORE INSERT OR UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_request_fields();

-- 4. Add server-side validation for company fields
CREATE OR REPLACE FUNCTION public.validate_company_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF length(trim(NEW.name)) < 1 THEN
    RAISE EXCEPTION 'Company name cannot be empty';
  END IF;
  IF length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Company name must be less than 100 characters';
  END IF;
  NEW.name = trim(NEW.name);
  IF NEW.description IS NOT NULL AND length(NEW.description) > 2000 THEN
    RAISE EXCEPTION 'Description must be less than 2000 characters';
  END IF;
  IF NEW.phone IS NOT NULL AND length(NEW.phone) > 20 THEN
    RAISE EXCEPTION 'Phone must be less than 20 characters';
  END IF;
  IF NEW.email IS NOT NULL AND length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email must be less than 255 characters';
  END IF;
  IF NEW.website IS NOT NULL AND length(NEW.website) > 255 THEN
    RAISE EXCEPTION 'Website must be less than 255 characters';
  END IF;
  IF NEW.address IS NOT NULL AND length(NEW.address) > 200 THEN
    RAISE EXCEPTION 'Address must be less than 200 characters';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_company_fields_trigger
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.validate_company_fields();

-- 5. Add server-side validation for review fields
CREATE OR REPLACE FUNCTION public.validate_review_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  IF NEW.comment IS NOT NULL AND length(NEW.comment) > 2000 THEN
    RAISE EXCEPTION 'Comment must be less than 2000 characters';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_review_fields_trigger
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review_fields();

-- 6. Add server-side validation for message content
CREATE OR REPLACE FUNCTION public.validate_message_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF length(trim(NEW.content)) < 1 THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;
  IF length(NEW.content) > 5000 THEN
    RAISE EXCEPTION 'Message must be less than 5000 characters';
  END IF;
  NEW.content = trim(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_message_fields_trigger
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_message_fields();
