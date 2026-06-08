import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import CompanyCard from "@/components/CompanyCard";
import { statsFromCompanyRow } from "@/lib/companyReviewStats";
import { companyCardCategoryProps } from "@/lib/companyDisplay";
import type { Company } from "@/hooks/useCompanies";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { SectionHeader } from "@/components/layout/PageHero";

type Props = {
  companies: Company[];
  title?: string;
  subtitle?: string;
  catalogLink?: string;
};

export function RecommendedCompaniesSection({
  companies,
  title = "Рекомендуем вам",
  subtitle = "Появляется после просмотров и действий; чем больше активности — тем точнее подбор",
  catalogLink = "/catalog?sort=for_you",
}: Props) {
  const { profile } = useAuth();

  if (companies.length === 0) return null;

  return (
    <section className="py-12 md:py-16 border-y bg-gradient-to-b from-primary/5 to-transparent">
      <div className="container px-4">
        <SectionHeader
          eyebrow="Персональная лента"
          title={title}
          description={
            profile
              ? subtitle
              : "Просматривайте компании — мы запомним интересы в этом браузере"
          }
          action={
            <Button variant="outline" asChild className="hidden sm:inline-flex gap-2 group shrink-0 rounded-xl">
              <Link to={catalogLink}>
                Весь каталог
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          }
          className="mb-10"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => {
            const cat = companyCardCategoryProps(
              company as { category: string; company_categories?: { category: string }[] },
            );
            return (
              <CompanyCard
                key={company.id}
                id={company.id}
                name={company.name}
                description={company.description || ""}
                city={company.city}
                reviewStats={statsFromCompanyRow(company)}
                overlayLabel={cat.overlayLabel}
                categoriesLine={cat.categoriesLine}
                imageUrl={company.logo_url || undefined}
                isVerified={!!company.is_verified}
              />
            );
          })}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button variant="outline" asChild className="rounded-xl">
            <Link to={catalogLink}>Смотреть каталог</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
