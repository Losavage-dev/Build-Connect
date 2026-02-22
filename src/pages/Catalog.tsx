import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import CompanyCard from "@/components/CompanyCard";
import Navbar from "@/components/Navbar";
import { useCompanies } from "@/hooks/useCompanies";
import { Skeleton } from "@/components/ui/skeleton";

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [city, setCity] = useState<string>(searchParams.get("city") || "all");
  const [category, setCategory] = useState<string>(searchParams.get("category") || "all");
  const [search, setSearch] = useState<string>(searchParams.get("search") || "");

  // Sync URL params to state on mount / URL change
  useEffect(() => {
    const urlCategory = searchParams.get("category");
    const urlCity = searchParams.get("city");
    const urlSearch = searchParams.get("search");
    if (urlCategory) setCategory(urlCategory);
    if (urlCity) setCity(urlCity);
    if (urlSearch) setSearch(urlSearch);
  }, [searchParams]);

  const { data: companies, isLoading, error } = useCompanies({
    city: city === "all" ? undefined : city,
    category: category === "all" ? undefined : category,
    search: search || undefined,
  });

  const cities = ["Алматы", "Астана", "Шымкент", "Караганда", "Актобе"];
  const categories = ["Строительство", "Ремонт", "Аренда техники", "Материалы", "Проектирование", "Инженерные системы"];

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
      
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Каталог компаний</h1>
          <p className="text-lg text-muted-foreground">
            {isLoading ? "Загрузка..." : `Найдено ${companies?.length || 0} компаний`}
          </p>
        </div>

        <div className="flex gap-6">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20 bg-card rounded-lg border p-6">
              <h2 className="font-semibold text-lg mb-4">Фильтры</h2>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    Фильтры
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Фильтры</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Search */}
            <div className="mb-6">
              <Input
                placeholder="Поиск по названию..."
                className="max-w-md"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CompanyCardSkeleton key={i} />
                ))}
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-destructive">Ошибка загрузки данных</p>
              </div>
            )}

            {!isLoading && !error && companies?.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">Компании не найдены</p>
                <p className="text-sm text-muted-foreground">
                  Попробуйте изменить параметры поиска или фильтры
                </p>
              </div>
            )}

            {!isLoading && !error && companies && companies.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {companies.map((company) => (
                  <CompanyCard
                    key={company.id}
                    id={company.id}
                    name={company.name}
                    description={company.description || ""}
                    city={company.city}
                    rating={Number(company.rating)}
                    reviewCount={company.review_count}
                    category={company.category}
                    imageUrl={company.logo_url || undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
