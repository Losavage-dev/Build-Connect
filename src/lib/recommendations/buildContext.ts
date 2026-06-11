import type { UserRole } from "@/lib/userRoles";
import type { GuestEvent } from "./localEvents";
import type { RecommendationContext, UserEventRow } from "./types";

const ROLE_CATEGORY_HINTS: Partial<Record<UserRole, string[]>> = {
  client: ["Строительство", "Ремонт", "Генеральный подряд"],
  contractor: ["Строительство", "Отделочные работы", "Генеральный подряд", "Ремонт"],
  supplier: ["Материалы", "Логистика / доставка"],
};

function addCategory(set: Set<string>, value: string | undefined | null) {
  if (value?.trim()) set.add(value.trim());
}

function categoriesFromMetadata(meta: Record<string, unknown> | null | undefined): string[] {
  if (!meta) return [];
  const cats = meta.categories;
  if (Array.isArray(cats)) return cats.filter((c): c is string => typeof c === "string");
  if (typeof meta.category === "string") return [meta.category];
  return [];
}

export function buildRecommendationContext(input: {
  profileId: string | null;
  role: UserRole | null;
  city: string | null;
  events: UserEventRow[];
  guestEvents?: GuestEvent[];
  myCompanyIds?: string[];
  trending?: { company_id: string; request_count: number }[];
}): RecommendationContext {
  const interestCategories = new Set<string>();
  const viewedCompanyIds = new Set<string>();
  const viewedTenderIds = new Set<string>();
  const contactedCompanyIds = new Set<string>();
  const myCompanyIds = new Set(input.myCompanyIds ?? []);
  const bidTenderIds = new Set<string>();
  const preferredTenderTypes = new Set<string>();
  const viewedMaterialIds = new Set<string>();
  const orderedMaterialIds = new Set<string>();
  const preferredMaterialGroups = new Set<string>();
  const interestMaterialGroupCounts = new Map<string, number>();
  const trendingCompanyScores = new Map<string, number>();

  function trackMaterialGroup(group: string | undefined | null) {
    const g = group?.trim();
    if (!g) return;
    preferredMaterialGroups.add(g);
    interestMaterialGroupCounts.set(g, (interestMaterialGroupCounts.get(g) ?? 0) + 1);
  }

  for (const row of input.trending ?? []) {
    trendingCompanyScores.set(row.company_id, Number(row.request_count) || 0);
  }

  const allEvents: UserEventRow[] = [
    ...input.events,
    ...(input.guestEvents ?? []).map((g) => ({
      event_type: g.event_type,
      entity_type: g.entity_type,
      entity_id: g.entity_id,
      metadata: g.metadata,
      created_at: g.created_at,
    })),
  ];

  for (const ev of allEvents) {
    for (const c of categoriesFromMetadata(ev.metadata as Record<string, unknown> | undefined)) {
      addCategory(interestCategories, c);
    }

    if (ev.entity_type === "company") {
      if (ev.event_type === "view_company") viewedCompanyIds.add(ev.entity_id);
      if (ev.event_type === "contact_company") contactedCompanyIds.add(ev.entity_id);
    }
    if (ev.entity_type === "tender" && ev.event_type === "view_tender") {
      viewedTenderIds.add(ev.entity_id);
      const meta = ev.metadata as Record<string, unknown> | undefined;
      if (typeof meta?.tender_type === "string") preferredTenderTypes.add(meta.tender_type);
    }
    if (ev.entity_type === "tender" && ev.event_type === "bid_tender") {
      bidTenderIds.add(ev.entity_id);
    }
    if (ev.event_type === "like_promo" && ev.metadata) {
      for (const c of categoriesFromMetadata(ev.metadata as Record<string, unknown>)) {
        addCategory(interestCategories, c);
      }
    }
    if (ev.entity_type === "material" && ev.event_type === "view_material") {
      viewedMaterialIds.add(ev.entity_id);
      const meta = ev.metadata as Record<string, unknown> | undefined;
      trackMaterialGroup(typeof meta?.material_group === "string" ? meta.material_group : null);
    }
    if (ev.entity_type === "material" && ev.event_type === "order_material") {
      orderedMaterialIds.add(ev.entity_id);
      const meta = ev.metadata as Record<string, unknown> | undefined;
      trackMaterialGroup(typeof meta?.material_group === "string" ? meta.material_group : null);
    }
  }

  for (const c of ROLE_CATEGORY_HINTS[input.role ?? "client"] ?? []) {
    addCategory(interestCategories, c);
  }

  return {
    profileId: input.profileId,
    role: input.role,
    city: input.city,
    interestCategories: [...interestCategories],
    viewedCompanyIds,
    viewedTenderIds,
    contactedCompanyIds,
    myCompanyIds,
    trendingCompanyScores,
    bidTenderIds,
    preferredTenderTypes,
    viewedMaterialIds,
    orderedMaterialIds,
    preferredMaterialGroups,
    interestMaterialGroups: [...interestMaterialGroupCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([g]) => g),
  };
}
