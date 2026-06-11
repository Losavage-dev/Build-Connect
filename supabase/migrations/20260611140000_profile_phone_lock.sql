-- Блокировка смены телефона после фиксации профиля (identity_locked_at).

CREATE OR REPLACE FUNCTION public.enforce_profile_identity_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IN ('moderator', 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.identity_locked_at IS NOT NULL THEN
    IF NEW.first_name IS DISTINCT FROM OLD.first_name OR NEW.last_name IS DISTINCT FROM OLD.last_name THEN
      IF OLD.name_correction_used_at IS NOT NULL THEN
        RAISE EXCEPTION 'Имя и фамилия зафиксированы. Для изменения напишите в поддержку.';
      END IF;
      IF OLD.created_at + interval '24 hours' < now() THEN
        RAISE EXCEPTION 'Исправление опечатки в ФИО доступно только в первые 24 часа после регистрации.';
      END IF;
      NEW.name_correction_used_at := now();
    END IF;

    IF NEW.phone IS DISTINCT FROM OLD.phone THEN
      RAISE EXCEPTION 'Телефон зафиксирован после заполнения профиля. Для изменения напишите в поддержку.';
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
