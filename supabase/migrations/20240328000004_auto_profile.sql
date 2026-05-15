-- Migration: Auto-create profile when user signs up

-- This trigger fires after a new user is inserted into auth.users
-- and automatically creates a corresponding row in public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role public.user_role;
  user_name text;
BEGIN
  -- Get role from metadata, default to 'client'
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'client'
  );

  -- Get name from metadata
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  INSERT INTO public.profiles (user_id, first_name, last_name, role)
  VALUES (
    NEW.id,
    SPLIT_PART(user_name, ' ', 1),
    CASE 
      WHEN POSITION(' ' IN user_name) > 0 
      THEN SUBSTRING(user_name FROM POSITION(' ' IN user_name) + 1)
      ELSE ''
    END,
    user_role
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
