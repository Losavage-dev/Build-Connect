-- Презентационные ролики (YouTube ID + метаданные на платформе), лайки и комментарии для ленты и будущих рекомендаций

CREATE TABLE public.company_promo_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  youtube_video_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_promo_posts_youtube_id_format CHECK (
    youtube_video_id ~ '^[a-zA-Z0-9_-]{11}$'
  )
);

CREATE INDEX company_promo_posts_company_id_idx ON public.company_promo_posts(company_id);
CREATE INDEX company_promo_posts_created_at_idx ON public.company_promo_posts(created_at DESC);

CREATE TABLE public.company_promo_likes (
  post_id uuid NOT NULL REFERENCES public.company_promo_posts(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, profile_id)
);

CREATE INDEX company_promo_likes_profile_id_idx ON public.company_promo_likes(profile_id);

CREATE TABLE public.company_promo_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.company_promo_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_quote_request boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_promo_comments_content_len CHECK (char_length(content) <= 2000)
);

CREATE INDEX company_promo_comments_post_id_idx ON public.company_promo_comments(post_id, created_at);

ALTER TABLE public.company_promo_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_promo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_promo_comments ENABLE ROW LEVEL SECURITY;

-- Посты: все читают; пишет только владелец компании
CREATE POLICY "Promo posts: public read" ON public.company_promo_posts
  FOR SELECT USING (true);

CREATE POLICY "Promo posts: owner insert" ON public.company_promo_posts
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Promo posts: owner update" ON public.company_promo_posts
  FOR UPDATE USING (
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Promo posts: owner delete" ON public.company_promo_posts
  FOR DELETE USING (
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.profiles p ON c.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Лайки
CREATE POLICY "Promo likes: public read" ON public.company_promo_likes
  FOR SELECT USING (true);

CREATE POLICY "Promo likes: own insert" ON public.company_promo_likes
  FOR INSERT WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Promo likes: own delete" ON public.company_promo_likes
  FOR DELETE USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Комментарии
CREATE POLICY "Promo comments: public read" ON public.company_promo_comments
  FOR SELECT USING (true);

CREATE POLICY "Promo comments: auth insert" ON public.company_promo_comments
  FOR INSERT WITH CHECK (
    author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Promo comments: author update" ON public.company_promo_comments
  FOR UPDATE USING (
    author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Promo comments: author delete" ON public.company_promo_comments
  FOR DELETE USING (
    author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Права Data API (новые таблицы не попадают под старый GRANT ALL TABLES)
GRANT SELECT ON public.company_promo_posts TO anon, authenticated;
GRANT SELECT ON public.company_promo_likes TO anon, authenticated;
GRANT SELECT ON public.company_promo_comments TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.company_promo_posts TO authenticated;
GRANT INSERT, DELETE ON public.company_promo_likes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.company_promo_comments TO authenticated;
