-- Вложения в чатах заявок: приватное хранилище, доступ только участникам заявки (как у messages).

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('request-attachments', 'request-attachments', false, 20971520)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit;

-- Путь объекта: {request_id}/{unique_filename} — первая папка = id заявки.

DROP POLICY IF EXISTS "Request attachments: participant read" ON storage.objects;
CREATE POLICY "Request attachments: participant read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'request-attachments'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT r.id
    FROM public.requests r
    WHERE r.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
       OR r.recipient_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
       OR r.company_id IN (
         SELECT c.id
         FROM public.companies c
         JOIN public.profiles p ON c.owner_id = p.id
         WHERE p.user_id = auth.uid()
       )
  )
);

DROP POLICY IF EXISTS "Request attachments: participant insert" ON storage.objects;
CREATE POLICY "Request attachments: participant insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'request-attachments'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT r.id
    FROM public.requests r
    WHERE r.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
       OR r.recipient_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
       OR r.company_id IN (
         SELECT c.id
         FROM public.companies c
         JOIN public.profiles p ON c.owner_id = p.id
         WHERE p.user_id = auth.uid()
       )
  )
);

DROP POLICY IF EXISTS "Request attachments: participant delete own prefix" ON storage.objects;
CREATE POLICY "Request attachments: participant delete own prefix"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'request-attachments'
  AND owner_id IS NOT NULL
  AND owner_id::uuid = auth.uid()
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT r.id
    FROM public.requests r
    WHERE r.client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
       OR r.recipient_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
       OR r.company_id IN (
         SELECT c.id
         FROM public.companies c
         JOIN public.profiles p ON c.owner_id = p.id
         WHERE p.user_id = auth.uid()
       )
  )
);
