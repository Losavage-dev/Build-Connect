import type { Service } from "@/hooks/useServices";
import type { RecommendationContext } from "./types";

const BUYER_ROLES = new Set(["client", "contractor"]);

export function scoreMaterial(material: Service, ctx: RecommendationContext): number {
  let score = 15;

  const group = material.material_group || "Прочее";

  if (ctx.city && material.company_city === ctx.city) score += 35;

  if (ctx.role && BUYER_ROLES.has(ctx.role)) score += 18;
  if (ctx.role === "supplier") score += 4;

  if (ctx.interestCategories.includes("Материалы")) score += 22;

  if (ctx.preferredMaterialGroups.has(group)) score += 28;

  for (const g of ctx.interestMaterialGroups) {
    if (g === group) score += 16;
  }

  if (material.price > 0) score += 8;

  if (ctx.viewedCompanyIds.has(material.company_id)) score += 10;

  if (ctx.viewedMaterialIds.has(material.id)) score -= 12;
  if (ctx.orderedMaterialIds.has(material.id)) score -= 180;
  if (ctx.myCompanyIds.has(material.company_id)) score -= 200;

  return score;
}

export function rankMaterials<T extends Service>(items: T[], ctx: RecommendationContext): T[] {
  return [...items].sort((a, b) => scoreMaterial(b, ctx) - scoreMaterial(a, ctx));
}
