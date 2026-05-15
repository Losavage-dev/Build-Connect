-- Migration: Auto-calculate company rating from reviews

-- Function to update company rating based on reviews
CREATE OR REPLACE FUNCTION public.update_company_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update when inserting or updating
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE public.companies
        SET rating = COALESCE((SELECT AVG(r.rating) FROM public.reviews r WHERE r.company_id = NEW.company_id), 0),
            review_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.company_id = NEW.company_id)
        WHERE id = NEW.company_id;
        RETURN NEW;
    END IF;

    -- Update when deleting
    IF (TG_OP = 'DELETE') THEN
        UPDATE public.companies
        SET rating = COALESCE((SELECT AVG(r.rating) FROM public.reviews r WHERE r.company_id = OLD.company_id), 0),
            review_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.company_id = OLD.company_id)
        WHERE id = OLD.company_id;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fires after any change to reviews
DROP TRIGGER IF EXISTS trigger_update_company_rating ON public.reviews;
CREATE TRIGGER trigger_update_company_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_company_rating();

-- Recalculate existing ratings based on current reviews
UPDATE public.companies c
SET rating = COALESCE(sub.avg_rating, 0),
    review_count = COALESCE(sub.cnt, 0)
FROM (
    SELECT company_id, AVG(rating) as avg_rating, COUNT(*) as cnt
    FROM public.reviews
    GROUP BY company_id
) sub
WHERE c.id = sub.company_id;
