import type { Service } from "@/hooks/useServices";
import type { RecommendationContext } from "./types";
import { scoreMaterial } from "./scoreMaterial";

export type MaterialRecommendationReason = {
  id: string;
  label: string;
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
    reasons.push({ id: "city", label: "В вашем городе" });
  }

  if (ctx.role && BUYER_ROLES.has(ctx.role)) {
    reasons.push({ id: "role", label: "Для закупок" });
  }

  if (ctx.preferredMaterialGroups.has(group) || ctx.interestMaterialGroups.includes(group)) {
    reasons.push({ id: "group", label: "Похожая категория" });
  }

  if (ctx.viewedCompanyIds.has(material.company_id)) {
    reasons.push({ id: "company", label: "Компания из ваших просмотров" });
  }

  if (!ctx.viewedMaterialIds.has(material.id)) {
    reasons.push({ id: "new", label: "Новый для вас" });
  }

  if (material.price > 0) {
    reasons.push({ id: "price", label: "Цена указана" });
  }

  return reasons.slice(0, 3);
}

export { MIN_RECOMMENDATION_SCORE };
