import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CompanyCard from "@/components/CompanyCard";
import { statsFromCompanyRow } from "@/lib/companyReviewStats";
import Navbar from "@/components/Navbar";
import { useCompanies } from "@/hooks/useCompanies";
import { companyCardCategoryProps } from "@/lib/companyDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import QueryErrorBlock from "@/components/QueryErrorBlock";
import { StaffBrowsingBanner } from "@/components/StaffBrowsingBanner";
import { BUSINESS_CATEGORIES, KAZAKHSTAN_CITIES } from "@/lib/constants";
import { useSortedCompanies } from "@/hooks/useRecommendations";
import type { SortMode } from "@/lib/recommendations";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHero, PageContent, EmptyState } from "@/components/layout/PageHero";
import { MarketplaceFilterLayout } from "@/components/MarketplaceFilterLayout";

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [city, setCity] = useState<string>(searchParams.get("city") || "all");
  const [category, setCategory] = useState<string>(searchParams.get("category") || "all");
  const [search, setSearch] = useState<string>(searchParams.get("search") || "");
  const sortParam = searchParams.get("sort");
  const [sortMode, setSortMode] = useState<SortMode>(sortParam === "for_you" ? "for_you" : "rating");

  // Sync URL params to state on mount / URL change
  useEffect(() => {
    const urlCategory = searchParams.get("category");
    const urlCity = searchParams.get("city");
    const urlSearch = searchParams.get("search");
    if (urlCategory) setCategory(urlCategory);
    if (urlCity) setCity(urlCity);
    if (urlSearch) setSearch(urlSearch);
    const urlSort = searchParams.get("sort");
    if (urlSort === "for_you") setSortMode("for_you");
    else if (urlSort === "rating") setSortMode("rating");
  }, [searchParams]);

  const { data: companies, isLoading, isError, error, refetch } = useCompanies({
    city: city === "all" ? undefined : city,
    category: category === "all" ? undefined : category,
    search: search || undefined,
  });
  const displayCompanies = useSortedCompanies(companies, sortMode);

  const cities = KAZAKHSTAN_CITIES;
  const categories = BUSINESS_CATEGORIES;

  const handleReset = () => {
    setCity("all");
    setCategory("all");
    setSearch("");
    setSearchParams({});
  };

  const FilterContent = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Город</label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите город" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все города</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Категория</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите категорию" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" className="w-full" onClick={handleReset}>
        Сбросить фильтры
      </Button>
    </div>
  );

  const CompanyCardSkeleton = () => (
    <div className="bg-card rounded-lg border p-6">
      <Skeleton className="aspect-video rounded-lg mb-4" />
      <Skeleton className="h-5 w-32 mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageHero
        eyebrow="Каталог"
        eyebrowIcon={Building2}
        title="Компании строительной отрасли"
        description={
          isLoading
            ? "Загрузка каталога…"
            : `Найдено ${displayCompanies.length || companies?.length || 0} проверенных компаний`
        }
        compact
      />

      <PageContent>
        <StaffBrowsingBanner />

        <MarketplaceFilterLayout filterContent={<FilterContent />}>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <Input
              placeholder="Поиск по названию..."
              className="max-w-md rounded-xl bg-card/80 border-border/60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Tabs
              value={sortMode}
              onValueChange={(v) => {
                const mode = v as SortMode;
                setSortMode(mode);
                const next = new URLSearchParams(searchParams);
                if (mode === "for_you") next.set("sort", "for_you");
                else next.delete("sort");
                setSearchParams(next, { replace: true });
              }}
            >
              <TabsList className="rounded-xl">
                <TabsTrigger value="rating">По рейтингу</TabsTrigger>
                <TabsTrigger value="for_you">Для вас</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CompanyCardSkeleton key={i} />
              ))}
            </div>
          )}

          {isError ? <QueryErrorBlock error={error} onRetry={() => refetch()} /> : null}

          {!isLoading && !isError && companies?.length === 0 && (
            <EmptyState
              icon={Building2}
              title="Компании не найдены"
              description="Попробуйте изменить параметры поиска или фильтры"
            />
          )}

          {!isLoading && !isError && displayCompanies.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayCompanies.map((company) => {
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
          )}
        </MarketplaceFilterLayout>
      </PageContent>
    </div>
  );
};

export default Catalog;
