import { useState } from "react";
import { Search, Building, Truck, Hammer, Package, ArrowRight, CheckCircle2, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CategoryCard from "@/components/CategoryCard";
import CompanyCard from "@/components/CompanyCard";
import { statsFromCompanyRow } from "@/lib/companyReviewStats";
import Navbar from "@/components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { useCompanies } from "@/hooks/useCompanies";
import { useRecommendedCompanies } from "@/hooks/useRecommendations";
import { RecommendedCompaniesSection } from "@/components/RecommendedCompaniesSection";
import { companyCategoryLabel, companyCardCategoryProps } from "@/lib/companyDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveUniversalSearchPath } from "@/lib/universalSearchRoute";
import QueryErrorBlock from "@/components/QueryErrorBlock";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { data: companies, isLoading, isError, error, refetch } = useCompanies();

  const categories = [
    { title: "Строительство", icon: Building, href: "/catalog?category=Строительство", description: "Подрядчики и строительные компании" },
    { title: "Ремонт", icon: Hammer, href: "/catalog?category=Ремонт", description: "Отделочные работы и ремонт" },
    { title: "Аренда техники", icon: Truck, href: "/catalog?category=Аренда спецтехники", description: "Спецтехника и оборудование" },
    { title: "Материалы", icon: Package, href: "/catalog?category=Материалы", description: "Поставщики строительных материалов" },
  ];

  const featuredCompanies = companies?.slice(0, 3) || [];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      navigate("/catalog");
      return;
    }
    const path = await resolveUniversalSearchPath(q);
    navigate(path);
    setSearchQuery("");
  };

  const stats = [
    { label: "Компаний", value: isLoading ? "..." : (companies?.length || 0) },
    { label: "Городов", value: isLoading ? "..." : (companies ? new Set(companies.map(c => c.city)).size : 0) },
    { label: "Категорий", value: isLoading ? "..." : (companies ? new Set(companies.flatMap((c) => (c as { company_categories?: { category: string }[] }).company_categories?.map((x) => x.category) || [c.category])).size : 0) },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-36" style={{ background: "var(--gradient-hero)" }}>
        {/* Decorative elements */}
        <div className="absolute top-20 right-[10%] w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-10 left-[5%] w-56 h-56 rounded-full bg-secondary/5 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        
        <div className="container px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
              <CheckCircle2 className="h-4 w-4" />
              Проверенные компании Казахстана
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] text-balance animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Найдите надёжных{" "}
              <span className="gradient-text">подрядчиков</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Маркетплейс строительных компаний, поставщиков материалов и аренды техники
            </p>
            
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Компания, услуга, материал или тендер..."
                  className="pl-12 h-14 text-base rounded-xl border-2 border-border/60 focus-visible:border-primary/40 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 rounded-xl btn-glow text-base font-semibold">
                Найти
              </Button>
            </form>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button asChild variant="secondary" size="lg" className="h-12 rounded-xl font-semibold gap-2 shadow-md">
                <Link to="/feed">
                  <Clapperboard className="h-5 w-5" />
                  Витрина роликов
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 md:gap-12 pt-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Категории услуг</h2>
            <p className="text-lg text-muted-foreground">Выберите нужную категорию</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, i) => (
              <div key={category.title} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <CategoryCard {...category} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {!isLoading && !isError && recommended.length > 0 && (
        <RecommendedCompaniesSection companies={recommended} />
      )}

      {/* Featured Companies */}
      <section className="py-20 md:py-28 bg-muted/40">
        <div className="container px-4">
          <div className="flex items-end justify-between mb-14">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Популярные компании</h2>
              <p className="text-lg text-muted-foreground">Проверенные подрядчики с высоким рейтингом</p>
            </div>
            <Button variant="outline" asChild className="hidden md:inline-flex gap-2 group">
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
                <div key={i} className="bg-card rounded-xl border p-6">
                  <Skeleton className="aspect-video rounded-lg mb-4" />
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
            <div className="text-center py-16">
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
            <Button variant="outline" asChild>
              <Link to="/catalog">Все компании</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <div className="rounded-3xl p-10 md:p-16 text-center text-primary-foreground relative overflow-hidden" style={{ background: "var(--gradient-cta)" }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_hsl(0_0%_100%_/_0.15),_transparent_60%)]" />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Разместите свою компанию
              </h2>
              <p className="text-lg mb-10 opacity-90 max-w-2xl mx-auto">
                Присоединяйтесь к BuildConnect и получайте больше заказов от клиентов по всему Казахстану
              </p>
              <Button size="lg" variant="secondary" asChild className="rounded-xl text-base font-semibold px-10 h-14 bg-background text-foreground hover:bg-background/90">
                <Link to="/auth">Начать сейчас</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                  <Building className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">BuildConnect</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Маркетплейс для строительной отрасли Казахстана
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Компаниям</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/auth" className="hover:text-primary transition-colors">Разместить компанию</Link></li>
                <li><Link to="/catalog" className="hover:text-primary transition-colors">Каталог</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Поддержка</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/help" className="hover:text-primary transition-colors">Помощь</Link></li>
                <li><Link to="/contacts" className="hover:text-primary transition-colors">Контакты</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">О нас</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary transition-colors">О проекте</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">Условия использования</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 BuildConnect. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
