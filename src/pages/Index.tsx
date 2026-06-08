import { Building, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CompanyCard from "@/components/CompanyCard";
import { BuildConnectLogo } from "@/components/BuildConnectLogo";
import { statsFromCompanyRow } from "@/lib/companyReviewStats";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanies } from "@/hooks/useCompanies";
import { useRecommendedCompanies } from "@/hooks/useRecommendations";
import { RecommendedCompaniesSection } from "@/components/RecommendedCompaniesSection";
import { companyCardCategoryProps } from "@/lib/companyDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import QueryErrorBlock from "@/components/QueryErrorBlock";
import { HomeHero, HomeTrustStrip } from "@/components/home/HomeHero";
import { HomeHowItWorks } from "@/components/home/HomeHowItWorks";
import { HomeCategoriesBento } from "@/components/home/HomeCategoriesBento";
import { HomeCta } from "@/components/home/HomeCta";

const Index = () => {
  const { user } = useAuth();
  const { data: companies, isLoading, isError, error, refetch } = useCompanies();

  const featuredCompanies = companies?.slice(0, 3) || [];
  const recommended = useRecommendedCompanies(companies, 6);

  const stats = [
    { label: "компаний в каталоге", value: isLoading ? "…" : companies?.length || 0 },
    {
      label: "городов",
      value: isLoading ? "…" : companies ? new Set(companies.map((c) => c.city)).size : 0,
    },
    {
      label: "категорий",
      value: isLoading
        ? "…"
        : companies
          ? new Set(
              companies.flatMap(
                (c) =>
                  (c as { company_categories?: { category: string }[] }).company_categories?.map(
                    (x) => x.category,
                  ) || [c.category],
              ),
            ).size
          : 0,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <HomeHero stats={stats} />
      <HomeTrustStrip />
      <HomeHowItWorks />
      <HomeCategoriesBento />

      {!isLoading && !isError && recommended.length > 0 && (
        <RecommendedCompaniesSection companies={recommended} />
      )}

      <section className="py-20 md:py-24 bg-muted/40">
        <div className="container px-4">
          <div className="flex items-end justify-between mb-12 gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
                Топ рейтинга
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Популярные компании</h2>
              <p className="text-muted-foreground text-lg max-w-lg">
                Проверенные подрядчики и поставщики с отзывами после реальных сделок.
              </p>
            </div>
            <Button variant="outline" asChild className="hidden md:inline-flex gap-2 group rounded-xl">
              <Link to="/catalog">
                Все компании
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {isError ? (
            <QueryErrorBlock error={error} onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border p-6">
                  <Skeleton className="aspect-video rounded-xl mb-4" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : featuredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCompanies.map((company) => {
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
          ) : (
            <div className="text-center py-16 rounded-2xl border-2 border-dashed border-border/60 bg-card/50">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Building className="h-10 w-10 text-primary" />
              </div>
              <p className="text-muted-foreground mb-6 text-lg">Компании пока не зарегистрированы</p>
              <Button asChild size="lg" className="btn-glow rounded-xl">
                <Link to="/auth">Добавить свою компанию</Link>
              </Button>
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild className="rounded-xl">
              <Link to="/catalog">Все компании</Link>
            </Button>
          </div>
        </div>
      </section>

      <HomeCta isLoggedIn={!!user} />

      <footer className="border-t py-14 bg-muted/30">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <Link
                to="/"
                className="inline-flex rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary mb-4"
              >
                <BuildConnectLogo size="sm" />
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                B2B-маркетплейс для строительной отрасли Казахстана: компании, тендеры, услуги и материалы.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide">Компаниям</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link to="/auth" className="hover:text-primary transition-colors">
                    Разместить компанию
                  </Link>
                </li>
                <li>
                  <Link to="/catalog" className="hover:text-primary transition-colors">
                    Каталог
                  </Link>
                </li>
                <li>
                  <Link to="/tenders" className="hover:text-primary transition-colors">
                    Тендеры
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide">Поддержка</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link to="/help" className="hover:text-primary transition-colors">
                    Помощь
                  </Link>
                </li>
                <li>
                  <Link to="/contacts" className="hover:text-primary transition-colors">
                    Контакты
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide">О проекте</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link to="/about" className="hover:text-primary transition-colors">
                    О BuildConnect
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-primary transition-colors">
                    Условия использования
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2026 BuildConnect. Все права защищены.</p>
            <p className="text-xs">Маркетплейс для строительных компаний · Казахстан</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
