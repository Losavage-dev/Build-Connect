import type { Tender } from "@/hooks/useTenders";
import type { RecommendationContext } from "./types";
import type { TenderTypeValue } from "@/lib/constants";

const ROLE_TENDER_TYPES: Partial<Record<string, TenderTypeValue[]>> = {
  contractor: ["subcontract", "other"],
  supplier: ["materials", "logistics", "other"],
  client: ["subcontract", "materials", "logistics", "other"],
};

export function scoreTender(tender: Tender, ctx: RecommendationContext): number {
  let score = 10;

  if (tender.status === "open") score += 40;
  else if (tender.status === "in_progress") score += 10;
  else score -= 50;

  if (ctx.city && tender.city === ctx.city) score += 35;

  const preferred = ROLE_TENDER_TYPES[ctx.role ?? ""] ?? [];
  const tType = (tender.tender_type || "other") as TenderTypeValue;
  if (preferred.includes(tType)) score += 28;

  if (tender.budget && tender.budget > 0) score += 8;
  if (tender.deadline) {
    const days = (new Date(tender.deadline).getTime() - Date.now()) / 86400000;
    if (days > 0 && days < 14) score += 12;
  }

  if (ctx.viewedTenderIds.has(tender.id)) score -= 15;
  if (tender.client_id === ctx.profileId) score -= 200;

  return score;
}

export function rankTenders<T extends Tender>(items: T[], ctx: RecommendationContext): T[] {
  return [...items].sort((a, b) => scoreTender(b, ctx) - scoreTender(a, ctx));
}
