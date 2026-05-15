import type { Company } from "@/hooks/useCompanies";
import type { RecommendationContext } from "./types";

function companyCategories(company: Company): string[] {
  const fromJoin = company.company_categories?.map((c) => c.category) ?? [];
  if (fromJoin.length > 0) return fromJoin;
  return company.category ? [company.category] : [];
}

export function scoreCompany(company: Company, ctx: RecommendationContext): number {
  let score = (company.rating ?? 0) * 12 + Math.min(company.review_count ?? 0, 50) * 0.4;

  if (company.is_verified) score += 45;

  if (ctx.city && company.city === ctx.city) score += 35;

  const cats = companyCategories(company);
  for (const cat of cats) {
    if (ctx.interestCategories.includes(cat)) score += 22;
  }

  const trending = ctx.trendingCompanyScores.get(company.id) ?? 0;
  score += Math.min(trending, 20) * 4;

  if (ctx.contactedCompanyIds.has(company.id)) score -= 120;
  if (ctx.myCompanyIds.has(company.id)) score -= 200;
  if (ctx.viewedCompanyIds.has(company.id)) score -= 8;

  return score;
}

export function rankCompanies<T extends Company>(items: T[], ctx: RecommendationContext): T[] {
  return [...items].sort((a, b) => scoreCompany(b, ctx) - scoreCompany(a, ctx));
}
