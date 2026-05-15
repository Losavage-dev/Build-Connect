-- Связка внутренней услуги компании с витриной public.services
ALTER TABLE public.company_services
ADD COLUMN IF NOT EXISTS vitrine_listing_id uuid REFERENCES public.services(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.company_services.vitrine_listing_id IS 'Строка в public.services для страницы «Услуги»';

-- Проект: дата старта и фаза (в процессе / завершён)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS project_phase text NOT NULL DEFAULT 'completed';

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_project_phase_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_project_phase_check
  CHECK (project_phase IN ('in_progress', 'completed'));

COMMENT ON COLUMN public.projects.project_phase IS 'in_progress | completed';

-- Фото проекта: роль кадра (галерея / начало / конец / ход работ)
ALTER TABLE public.project_images
ADD COLUMN IF NOT EXISTS image_role text NOT NULL DEFAULT 'gallery';

ALTER TABLE public.project_images DROP CONSTRAINT IF EXISTS project_images_image_role_check;
ALTER TABLE public.project_images ADD CONSTRAINT project_images_image_role_check
  CHECK (image_role IN ('gallery', 'site_start', 'site_end', 'work_in_progress'));

COMMENT ON COLUMN public.project_images.image_role IS 'gallery | site_start | site_end | work_in_progress';
