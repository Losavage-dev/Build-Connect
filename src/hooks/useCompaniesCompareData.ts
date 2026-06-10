import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { companyCategoryLabel } from "@/lib/companyDisplay";
import { statsFromCompanyRow } from "@/lib/companyReviewStats";

export type CompanyCompareRow = {
  id: string;
  name: string;
  city: string;
  categoriesLine: string;
  description: string;
  isVerified: boolean;
  averageRating: number | null;
  reviewCount: number;
  servicesCount: number;
  materialsCount: number;
  portfolioCount: number;
  phone: string | null;
  website: string | null;
  bin: string | null;
};

export function useCompaniesCompareData(ids: string[]) {
  const sortedKey = [...ids].sort().join(",");

  return useQuery({
    queryKey: ["companies-compare", sortedKey],
    enabled: ids.length >= 2,
    queryFn: async (): Promise<CompanyCompareRow[]> => {
      const { data, error } = await supabase
        .from("companies")
        .select(
          `
          id,
          name,
          city,
          category,
          description,
          phone,
          website,
          bin,
          is_verified,
          rating,
          review_count,
          company_categories (category),
          company_services (id),
          services (id, category),
          projects (id)
        `,
        )
        .in("id", ids)
        .eq("verification_status", "verified");

      if (error) throw error;

      const order = new Map(ids.map((id, index) => [id, index]));
      const rows = (data || [])
        .map((company) => {
          const stats = statsFromCompanyRow(company);
          const vitrine = (company.services || []) as { id: string; category: string }[];
          const materialsCount = vitrine.filter((s) => s.category === "Материалы").length;
          const servicesCount = vitrine.filter((s) => s.category !== "Материалы").length;

          return {
            id: company.id,
            name: company.name,
            city: company.city,
            categoriesLine: companyCategoryLabel(company),
            description: company.description?.trim() || "—",
            isVerified: !!company.is_verified,
            averageRating: stats.averageRating,
            reviewCount: stats.count,
            servicesCount: servicesCount || (company.company_services?.length ?? 0),
            materialsCount,
            portfolioCount: company.projects?.length ?? 0,
            phone: company.phone,
            website: company.website,
            bin: company.bin ?? null,
          } satisfies CompanyCompareRow;
        })
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

      return rows;
    },
  });
}
