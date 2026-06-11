import type { Tender } from "@/hooks/useTenders";
import type { TenderTypeValue } from "@/lib/constants";
import type { RecommendationContext } from "./types";
import { scoreTender } from "./scoreTender";

export type TenderRecommendationReason = {
  id: string;
};

const ROLE_TENDER_TYPES: Partial<Record<string, TenderTypeValue[]>> = {
  contractor: ["subcontract", "other"],
  supplier: ["materials", "logistics", "other"],
  client: ["subcontract", "materials", "logistics", "other"],
};

const TENDER_TYPE_INTEREST_CATEGORIES: Partial<Record<TenderTypeValue, string[]>> = {
  subcontract: ["Строительство", "Генеральный подряд", "Отделочные работы", "Ремонт"],
  materials: ["Материалы"],
  logistics: ["Логистика / доставка"],
  other: [],
};

const MIN_RECOMMENDATION_SCORE = 55;

export function isTenderRecommendable(tender: Tender, ctx: RecommendationContext): boolean {
  if (tender.status !== "open") return false;
  if (ctx.profileId && tender.client_id === ctx.profileId) return false;
  if (ctx.bidTenderIds.has(tender.id)) return false;
  return scoreTender(tender, ctx) >= MIN_RECOMMENDATION_SCORE;
}

export function getTenderRecommendationReasons(
  tender: Tender,
  ctx: RecommendationContext,
): TenderRecommendationReason[] {
  const reasons: TenderRecommendationReason[] = [];
  const tType = (tender.tender_type || "other") as TenderTypeValue;

  if (ctx.city && tender.city === ctx.city) {
    reasons.push({ id: "city" });
  }

  const preferred = ROLE_TENDER_TYPES[ctx.role ?? ""] ?? [];
  if (ctx.role && preferred.includes(tType)) {
    reasons.push({ id: "role" });
  }

  const typeCats = TENDER_TYPE_INTEREST_CATEGORIES[tType] ?? [];
  if (typeCats.some((c) => ctx.interestCategories.includes(c))) {
    reasons.push({ id: "interest" });
  }

  if (ctx.preferredTenderTypes.has(tType)) {
    reasons.push({ id: "views" });
  }

  if (tender.deadline) {
    const days = (new Date(tender.deadline).getTime() - Date.now()) / 86400000;
    if (days > 0 && days < 14) {
      reasons.push({ id: "deadline" });
    }
  }

  if (tender.budget && tender.budget > 0) {
    reasons.push({ id: "budget" });
  }

  if (!ctx.viewedTenderIds.has(tender.id)) {
    reasons.push({ id: "new" });
  }

  return reasons.slice(0, 3);
}

export { MIN_RECOMMENDATION_SCORE };
