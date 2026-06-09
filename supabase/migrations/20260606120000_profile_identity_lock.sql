-- ╨д╨╕╨║╤Б╨░╤Ж╨╕╤П ╨д╨Ш╨Ю ╨┐╨╛╤Б╨╗╨╡ ╨╖╨░╨┐╨╛╨╗╨╜╨╡╨╜╨╕╤П ╨┐╤А╨╛╤Д╨╕╨╗╤П + ╨╛╨┤╨╜╨╛ ╨╕╤Б╨┐╤А╨░╨▓╨╗╨╡╨╜╨╕╨╡ ╨▓ 24╤З

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identity_locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS name_correction_used_at timestamptz;

COMMENT ON COLUMN public.profiles.identity_locked_at IS
  '╨Ъ╨╛╨│╨┤╨░ ╨╖╨░╨┐╨╛╨╗╨╜╨╡╨╜╤Л ╨д╨Ш╨Ю+╤В╨╡╨╗╨╡╤Д╨╛╨╜+╨│╨╛╤А╨╛╨┤ тАФ ╨╕╨╝╤П ╨╕ ╤Д╨░╨╝╨╕╨╗╨╕╤П ╤Д╨╕╨║╤Б╨╕╤А╤Г╤О╤В╤Б╤П (╨║╤А╨╛╨╝╨╡ ╨╛╨┤╨╜╨╛╨╣ ╨┐╤А╨░╨▓╨║╨╕ ╨▓ 24╤З).';
COMMENT ON COLUMN public.profiles.name_correction_used_at IS
  '╨Х╨┤╨╕╨╜╤Б╤В╨▓╨╡╨╜╨╜╨╛╨╡ ╨╕╤Б╨┐╤А╨░╨▓╨╗╨╡╨╜╨╕╨╡ ╨╛╨┐╨╡╤З╨░╤В╨║╨╕ ╨▓ ╨д╨Ш╨Ю ╨▓ ╤В╨╡╤З╨╡╨╜╨╕╨╡ 24╤З ╨┐╨╛╤Б╨╗╨╡ ╤А╨╡╨│╨╕╤Б╤В╤А╨░╤Ж╨╕╨╕.';

-- ╨б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨╕╨╡ ╨┐╨╛╨╗╨╜╤Л╨╡ ╨┐╤А╨╛╤Д╨╕╨╗╨╕ ╤Б╤З╨╕╤В╨░╨╡╨╝ ╤Г╨╢╨╡ ╨╖╨░╤Д╨╕╨║╤Б╨╕╤А╨╛╨▓╨░╨╜╨╜╤Л╨╝╨╕
UPDATE public.profiles
SET identity_locked_at = COALESCE(updated_at, created_at)
WHERE identity_locked_at IS NULL
  AND trim(coalesce(first_name, '')) <> ''
  AND trim(coalesce(last_name, '')) <> ''
  AND trim(coalesce(phone, '')) <> ''
  AND trim(coalesce(city, '')) <> '';

-- ╨а╨╡╨│╨╕╤Б╤В╤А╨░╤Ж╨╕╤П: first_name / last_name ╨▓ metadata (fallback тАФ full_name)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role public.user_role;
  user_name text;
  fn text;
  ln text;
BEGIN
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'client'
  );

  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  fn := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'first_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'given_name'), ''),
    NULLIF(trim(SPLIT_PART(user_name, ' ', 1)), ''),
    ''
  );

  ln := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'last_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'family_name'), ''),
    CASE
      WHEN POSITION(' ' IN user_name) > 0 THEN trim(SUBSTRING(user_name FROM POSITION(' ' IN user_name) + 1))
      ELSE ''
    END,
    ''
  );

  INSERT INTO public.profiles (user_id, first_name, last_name, role)
  VALUES (NEW.id, fn, ln, user_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.enforce_profile_identity_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- ╨Ь╨╛╨┤╨╡╤А╨░╤В╨╛╤А╤Л/╨░╨┤╨╝╨╕╨╜╤Л: ╨▒╨╡╨╖ ╨╛╨│╤А╨░╨╜╨╕╤З╨╡╨╜╨╕╨╣ ╨╜╨░ ╨д╨Ш╨Ю
  IF NEW.role IN ('moderator', 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.identity_locked_at IS NOT NULL THEN
    IF NEW.first_name IS DISTINCT FROM OLD.first_name OR NEW.last_name IS DISTINCT FROM OLD.last_name THEN
      IF OLD.name_correction_used_at IS NOT NULL THEN
        RAISE EXCEPTION '╨Ш╨╝╤П ╨╕ ╤Д╨░╨╝╨╕╨╗╨╕╤П ╨╖╨░╤Д╨╕╨║╤Б╨╕╤А╨╛╨▓╨░╨╜╤Л. ╨Ф╨╗╤П ╨╕╨╖╨╝╨╡╨╜╨╡╨╜╨╕╤П ╨╜╨░╨┐╨╕╤И╨╕╤В╨╡ ╨▓ ╨┐╨╛╨┤╨┤╨╡╤А╨╢╨║╤Г.';
      END IF;
      IF OLD.created_at + interval '24 hours' < now() THEN
        RAISE EXCEPTION '╨Ш╤Б╨┐╤А╨░╨▓╨╗╨╡╨╜╨╕╨╡ ╨╛╨┐╨╡╤З╨░╤В╨║╨╕ ╨▓ ╨д╨Ш╨Ю ╨┤╨╛╤Б╤В╤Г╨┐╨╜╨╛ ╤В╨╛╨╗╤М╨║╨╛ ╨▓ ╨┐╨╡╤А╨▓╤Л╨╡ 24 ╤З╨░╤Б╨░ ╨┐╨╛╤Б╨╗╨╡ ╤А╨╡╨│╨╕╤Б╤В╤А╨░╤Ж╨╕╨╕.';
      END IF;
      NEW.name_correction_used_at := now();
    END IF;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.identity_locked_at IS NULL
     AND trim(coalesce(NEW.first_name, '')) <> ''
     AND trim(coalesce(NEW.last_name, '')) <> ''
     AND trim(coalesce(NEW.phone, '')) <> ''
     AND trim(coalesce(NEW.city, '')) <> '' THEN
    NEW.identity_locked_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_identity_rules ON public.profiles;
CREATE TRIGGER trg_profiles_identity_rules
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_profile_identity_rules();
