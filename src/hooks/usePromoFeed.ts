import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackUserEvent } from "@/lib/recommendations";
import { useAuth } from "@/contexts/AuthContext";

export interface PromoPostCompany {
  id: string;
  name: string;
  logo_url: string | null;
  city: string;
  category: string;
  owner_id: string;
}

export interface PromoComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  is_quote_request: boolean;
  created_at: string;
  author?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export interface PromoPostRow {
  id: string;
  company_id: string;
  youtube_video_id: string;
  title: string;
  caption: string | null;
  created_at: string;
  company: PromoPostCompany;
}

export interface PromoPostEnriched extends PromoPostRow {
  likeCount: number;
  likedByMe: boolean;
  comments: PromoComment[];
  /** Тематики ролика (по каким направлениям показана работа) */
  videoCategories: string[];
}

export type PromoFeedFilters = {
  city?: string;
  category?: string;
};

async function fetchEnrichedFeed(myProfileId: string | null): Promise<PromoPostEnriched[]> {
  const { data: posts, error: postsError } = await supabase
    .from("company_promo_posts")
    .select(
      `
      id,
      company_id,
      youtube_video_id,
      title,
      caption,
      created_at,
      company:companies!inner(id, name, logo_url, city, category, verification_status, owner_id)
    `,
    )
    .eq("company.verification_status", "verified")
    .order("created_at", { ascending: false })
    .limit(80);

  if (postsError) throw postsError;
  if (!posts?.length) return [];

  const postIds = posts.map((p) => p.id);

  const { data: likes, error: likesError } = await supabase
    .from("company_promo_likes")
    .select("post_id, profile_id")
    .in("post_id", postIds);

  if (likesError) throw likesError;

  const { data: comments, error: commentsError } = await supabase
    .from("company_promo_comments")
    .select(
      `
      id,
      post_id,
      author_id,
      content,
      is_quote_request,
      created_at,
      author:profiles(first_name, last_name, avatar_url)
    `,
    )
    .in("post_id", postIds)
    .order("created_at", { ascending: true });

  if (commentsError) throw commentsError;

  const { data: postCats } = await supabase
    .from("company_promo_post_categories")
    .select("post_id, category")
    .in("post_id", postIds);

  const catsByPost = new Map<string, string[]>();
  for (const row of postCats || []) {
    const list = catsByPost.get(row.post_id) || [];
    list.push(row.category);
    catsByPost.set(row.post_id, list);
  }

  const likeCount = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const row of likes || []) {
    likeCount.set(row.post_id, (likeCount.get(row.post_id) || 0) + 1);
    if (myProfileId && row.profile_id === myProfileId) likedByMe.add(row.post_id);
  }

  const commentsByPost = new Map<string, PromoComment[]>();
  for (const c of (comments || []) as PromoComment[]) {
    const list = commentsByPost.get(c.post_id) || [];
    list.push(c);
    commentsByPost.set(c.post_id, list);
  }

  return (posts as PromoPostRow[]).map((p) => ({
    ...p,
    likeCount: likeCount.get(p.id) || 0,
    likedByMe: likedByMe.has(p.id),
    comments: commentsByPost.get(p.id) || [],
    videoCategories: catsByPost.get(p.id) || [],
  }));
}

export function usePromoFeed(filters?: PromoFeedFilters) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["promo-feed", profile?.id, filters?.city, filters?.category],
    queryFn: async () => {
      const all = await fetchEnrichedFeed(profile?.id ?? null);
      return all.filter((p) => {
        if (filters?.city && filters.city !== "all" && p.company.city !== filters.city) return false;
        if (filters?.category && filters.category !== "all") {
          const tags = p.videoCategories || [];
          if (!tags.includes(filters.category)) return false;
        }
        return true;
      });
    },
    staleTime: 30_000,
  });
}

export function useTogglePromoLike() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      postId,
      currentlyLiked,
      videoCategories,
    }: {
      postId: string;
      currentlyLiked: boolean;
      videoCategories?: string[];
    }) => {
      if (!profile) throw new Error("Не авторизован");

      if (currentlyLiked) {
        const { error } = await supabase
          .from("company_promo_likes")
          .delete()
          .eq("post_id", postId)
          .eq("profile_id", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_promo_likes").insert({
          post_id: postId,
          profile_id: profile.id,
        });
        if (error) throw error;
        trackUserEvent(profile.id, "like_promo", "promo_post", postId, {
          categories: videoCategories ?? [],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-feed"] });
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
    },
  });
}

export function useAddPromoComment() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      postId: string;
      content: string;
      isQuoteRequest: boolean;
    }) => {
      if (!profile) throw new Error("Не авторизован");

      const { error } = await supabase.from("company_promo_comments").insert({
        post_id: input.postId,
        author_id: profile.id,
        content: input.content.trim(),
        is_quote_request: input.isQuoteRequest,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-feed"] });
    },
  });
}

export function useCreatePromoPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      companyId: string;
      youtubeVideoId: string;
      title: string;
      caption?: string;
      categories?: string[];
    }) => {
      const { data, error } = await supabase
        .from("company_promo_posts")
        .insert({
          company_id: input.companyId,
          youtube_video_id: input.youtubeVideoId,
          title: input.title.trim() || "Презентация",
          caption: input.caption?.trim() || null,
        })
        .select("id")
        .single();

      if (error) throw error;

      const cats = [...new Set((input.categories || []).map((c) => c.trim()).filter(Boolean))];
      if (cats.length > 0) {
        const { error: cErr } = await supabase.from("company_promo_post_categories").insert(
          cats.map((category) => ({ post_id: data.id, category })),
        );
        if (cErr) throw cErr;
      }

      return data;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["promo-feed"] });
      queryClient.invalidateQueries({ queryKey: ["company", v.companyId] });
      queryClient.invalidateQueries({ queryKey: ["company-promo-posts", v.companyId] });
    },
  });
}

export function useDeletePromoPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, companyId }: { postId: string; companyId: string }) => {
      const { error } = await supabase.from("company_promo_posts").delete().eq("id", postId);
      if (error) throw error;
      return companyId;
    },
    onSuccess: (companyId) => {
      queryClient.invalidateQueries({ queryKey: ["promo-feed"] });
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      queryClient.invalidateQueries({ queryKey: ["company-promo-posts", companyId] });
    },
  });
}

/** Ролики витрины для одной компании. Категории — отдельным запросом: вложенный select иногда падает в PostgREST, из‑за чего список в управлении оказывался пустым при живой ленте /feed. */
export function useCompanyPromoPosts(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-promo-posts", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data: posts, error: postsError } = await supabase
        .from("company_promo_posts")
        .select("id, youtube_video_id, title, caption, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.warn("[useCompanyPromoPosts] posts", postsError.message);
        return [];
      }
      if (!posts?.length) return [];

      const postIds = posts.map((p) => p.id);
      const { data: catRows, error: catError } = await supabase
        .from("company_promo_post_categories")
        .select("post_id, category")
        .in("post_id", postIds);

      if (catError) {
        console.warn("[useCompanyPromoPosts] categories", catError.message);
      }

      const catsByPost = new Map<string, { category: string }[]>();
      for (const row of catRows || []) {
        const list = catsByPost.get(row.post_id) || [];
        list.push({ category: row.category });
        catsByPost.set(row.post_id, list);
      }

      return posts.map((p) => ({
        ...p,
        company_promo_post_categories: catsByPost.get(p.id) ?? [],
      })) as {
        id: string;
        youtube_video_id: string;
        title: string;
        caption: string | null;
        created_at: string;
        company_promo_post_categories: { category: string }[];
      }[];
    },
    enabled: !!companyId,
  });
}
