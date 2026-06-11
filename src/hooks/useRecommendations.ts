import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildRecommendationContext,
  rankCompanies,
  rankTenders,
  rankMaterials,
  readGuestEvents,
  getTenderRecommendationReasons,
  getMaterialRecommendationReasons,
  isTenderRecommendable,
  isMaterialRecommendable,
  type RecommendationContext,
  type SortMode,
  type TenderRecommendationReason,
  type MaterialRecommendationReason,
} from "@/lib/recommendations";
import type { Company } from "@/hooks/useCompanies";
import type { Tender } from "@/hooks/useTenders";
import type { Service } from "@/hooks/useServices";
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

/** Профиль или поведение — достаточно для персонального блока тендеров. */
export function useCanShowRecommendations(): boolean {
  const { profile } = useAuth();
  const hasSignals = useHasPersonalizationSignals();

  return useMemo(() => {
    if (hasSignals) return true;
    if (profile?.city?.trim()) return true;
    if (profile?.role === "client" || profile?.role === "contractor" || profile?.role === "supplier") {
      return true;
    }
    return readGuestEvents().length > 0;
  }, [hasSignals, profile?.city, profile?.role]);
}

export type RecommendedTenderItem = {
  tender: Tender;
  reasons: TenderRecommendationReason[];
};

/** Рекомендации: профиль + поведение; минимум 2 релевантных открытых тендера. */
export function useRecommendedTenders(tenders: Tender[] | undefined, maxItems = 6): RecommendedTenderItem[] {
  const { ctx } = useRecommendationContext();
  const canShow = useCanShowRecommendations();

  return useMemo(() => {
    if (!tenders?.length || !canShow) return [];
    const open = tenders.filter((t) => t.status === "open");
    const pool = open.length > 0 ? open : tenders;
    const ranked = rankTenders(pool, ctx).filter((t) => isTenderRecommendable(t, ctx));
    if (ranked.length < 2) return [];
    const cap = Math.min(maxItems, ranked.length);
    return ranked.slice(0, cap).map((tender) => ({
      tender,
      reasons: getTenderRecommendationReasons(tender, ctx),
    }));
  }, [tenders, ctx, maxItems, canShow]);
}

export function useSortedTenders(tenders: Tender[] | undefined, sortMode: SortMode) {
  const { ctx } = useRecommendationContext();

  return useMemo(() => {
    if (!tenders?.length) return [];
    if (sortMode === "for_you") return rankTenders(tenders, ctx);
    return tenders;
  }, [tenders, sortMode, ctx]);
}

export type RecommendedMaterialItem = {
  material: Service;
  reasons: MaterialRecommendationReason[];
};

/** Рекомендации материалов: профиль + поведение; минимум 2 релевантных позиции. */
export function useRecommendedMaterials(materials: Service[] | undefined, maxItems = 6): RecommendedMaterialItem[] {
  const { ctx } = useRecommendationContext();
  const canShow = useCanShowRecommendations();

  return useMemo(() => {
    if (!materials?.length || !canShow) return [];
    const ranked = rankMaterials(materials, ctx).filter((m) => isMaterialRecommendable(m, ctx));
    if (ranked.length < 2) return [];
    const cap = Math.min(maxItems, ranked.length);
    return ranked.slice(0, cap).map((material) => ({
      material,
      reasons: getMaterialRecommendationReasons(material, ctx),
    }));
  }, [materials, ctx, maxItems, canShow]);
}

export function useSortedMaterials(materials: Service[] | undefined, sortMode: SortMode) {
  const { ctx } = useRecommendationContext();

  return useMemo(() => {
    if (!materials?.length) return [];
    if (sortMode === "for_you") return rankMaterials(materials, ctx);
    return materials;
  }, [materials, sortMode, ctx]);
}
