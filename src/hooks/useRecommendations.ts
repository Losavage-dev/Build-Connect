import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildRecommendationContext,
  rankCompanies,
  rankTenders,
  readGuestEvents,
  type RecommendationContext,
  type SortMode,
} from "@/lib/recommendations";
import type { Company } from "@/hooks/useCompanies";
import type { Tender } from "@/hooks/useTenders";
import { useUserEvents } from "@/hooks/useUserEvents";
import type { UserRole } from "@/lib/userRoles";

function recommendationRole(role: string | undefined): UserRole | null {
  if (role === "client" || role === "contractor" || role === "supplier") return role;
  return null;
}

function useTrendingCompanies() {
  return useQuery({
    queryKey: ["trending-companies"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_trending_company_ids", { p_limit: 40 });
      if (error) throw error;
      return (data ?? []) as { company_id: string; request_count: number }[];
    },
    staleTime: 5 * 60_000,
  });
}

function useMyCompanyIds(profileId: string | undefined) {
  return useQuery({
    queryKey: ["my-company-ids", profileId],
    queryFn: async () => {
      if (!profileId) return [] as string[];
      const { data, error } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", profileId);
      if (error) throw error;
      return (data ?? []).map((r) => r.id as string);
    },
    enabled: !!profileId,
    staleTime: 120_000,
  });
}

export function useRecommendationContext(): {
  ctx: RecommendationContext;
  isLoading: boolean;
} {
  const { profile } = useAuth();
  const { data: events = [], isLoading: eventsLoading } = useUserEvents();
  const { data: trending = [], isLoading: trendingLoading } = useTrendingCompanies();
  const { data: myCompanyIds = [], isLoading: companiesLoading } = useMyCompanyIds(profile?.id);

  const guestEvents = readGuestEvents();

  const ctx = useMemo(
    () =>
      buildRecommendationContext({
        profileId: profile?.id ?? null,
        role: recommendationRole(profile?.role),
        city: profile?.city ?? null,
        events,
        guestEvents: profile?.id ? [] : guestEvents,
        myCompanyIds,
        trending,
      }),
    [profile?.id, profile?.role, profile?.city, events, guestEvents, myCompanyIds, trending],
  );

  return {
    ctx,
    isLoading: eventsLoading || trendingLoading || companiesLoading,
  };
}

export function useSortedCompanies(companies: Company[] | undefined, sortMode: SortMode) {
  const { ctx } = useRecommendationContext();

  return useMemo(() => {
    if (!companies?.length) return [];
    if (sortMode === "rating") return companies;
    return rankCompanies(companies, ctx);
  }, [companies, sortMode, ctx]);
}

/** Есть ли сигналы для персонального блока «Для вас» (события в БД или в localStorage у гостя). */
export function useHasPersonalizationSignals(): boolean {
  const { profile } = useAuth();
  const { data: events = [] } = useUserEvents();

  return useMemo(() => {
    if (profile?.id) return events.length > 0;
    return readGuestEvents().length > 0;
  }, [profile?.id, events.length]);
}

/** Рекомендации только при наличии поведенческих сигналов; число карточек — сколько есть, не больше maxItems. */
export function useRecommendedCompanies(companies: Company[] | undefined, maxItems = 6) {
  const { ctx } = useRecommendationContext();
  const hasSignals = useHasPersonalizationSignals();

  return useMemo(() => {
    if (!companies?.length || !hasSignals) return [];
    const ranked = rankCompanies(companies, ctx);
    const cap = Math.min(maxItems, ranked.length);
    return ranked.slice(0, cap);
  }, [companies, ctx, maxItems, hasSignals]);
}

export function useRecommendedTenders(tenders: Tender[] | undefined, maxItems = 6) {
  const { ctx } = useRecommendationContext();
  const hasSignals = useHasPersonalizationSignals();

  return useMemo(() => {
    if (!tenders?.length || !hasSignals) return [];
    const open = tenders.filter((t) => t.status === "open");
    const pool = open.length > 0 ? open : tenders;
    const ranked = rankTenders(pool, ctx);
    const cap = Math.min(maxItems, ranked.length);
    return ranked.slice(0, cap);
  }, [tenders, ctx, maxItems, hasSignals]);
}

export function useSortedTenders(tenders: Tender[] | undefined, sortMode: SortMode) {
  const { ctx } = useRecommendationContext();

  return useMemo(() => {
    if (!tenders?.length) return [];
    if (sortMode === "for_you") return rankTenders(tenders, ctx);
    return tenders;
  }, [tenders, sortMode, ctx]);
}
