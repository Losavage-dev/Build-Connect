import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import CompanyCard from "@/components/CompanyCard";
import { statsFromCompanyRow } from "@/lib/companyReviewStats";
import { companyCardCategoryProps } from "@/lib/companyDisplay";
import type { Company } from "@/hooks/useCompanies";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  companies: Company[];
  title?: string;
  subtitle?: string;
  catalogLink?: string;
};

export function RecommendedCompaniesSection({
  companies,
  title = "Рекомендуем вам",
  subtitle = "На основе ваших просмотров, города и активности на платформе",
  catalogLink = "/catalog?sort=for_you",
}: Props) {
  const { profile } = useAuth();

  if (companies.length === 0) return null;

  return (
    <section className="py-20 md:py-28 border-t bg-gradient-to-b from-primary/5 to-transparent">
      <div className="container px-4">
        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-2">
              <Sparkles className="h-4 w-4" />
              Персональная лента
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{title}</h2>
            <p className="text-muted-foreground max-w-xl">
              {profile
                ? subtitle
                : "Просматривайте компании — мы запомним интересы в этом браузере"}
            </p>
          </div>
          <Button variant="outline" asChild className="hidden sm:inline-flex gap-2 group shrink-0">
            <Link to={catalogLink}>
              Весь каталог
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

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
          <Button variant="outline" asChild>
            <Link to={catalogLink}>Смотреть каталог</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
