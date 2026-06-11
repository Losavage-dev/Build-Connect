import type { Service } from "@/hooks/useServices";
import type { RecommendationContext } from "./types";
import { scoreMaterial } from "./scoreMaterial";

export type MaterialRecommendationReason = {
  id: string;
};

const BUYER_ROLES = new Set(["client", "contractor"]);

const MIN_RECOMMENDATION_SCORE = 48;

export function isMaterialRecommendable(material: Service, ctx: RecommendationContext): boolean {
  if (ctx.myCompanyIds.has(material.company_id)) return false;
  if (ctx.orderedMaterialIds.has(material.id)) return false;
  return scoreMaterial(material, ctx) >= MIN_RECOMMENDATION_SCORE;
}

export function getMaterialRecommendationReasons(
  material: Service,
  ctx: RecommendationContext,
): MaterialRecommendationReason[] {
  const reasons: MaterialRecommendationReason[] = [];
  const group = material.material_group || "Прочее";

  if (ctx.city && material.company_city === ctx.city) {
    reasons.push({ id: "city" });
  }

  if (ctx.role && BUYER_ROLES.has(ctx.role)) {
    reasons.push({ id: "role" });
  }

  if (ctx.preferredMaterialGroups.has(group) || ctx.interestMaterialGroups.includes(group)) {
    reasons.push({ id: "group" });
  }

  if (ctx.viewedCompanyIds.has(material.company_id)) {
    reasons.push({ id: "company" });
  }

  if (!ctx.viewedMaterialIds.has(material.id)) {
    reasons.push({ id: "new" });
  }

  if (material.price > 0) {
    reasons.push({ id: "price" });
  }

  return reasons.slice(0, 3);
}

export { MIN_RECOMMENDATION_SCORE };
