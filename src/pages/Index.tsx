import { useState } from "react";
import { Search, Building, Truck, Hammer, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CategoryCard from "@/components/CategoryCard";
import CompanyCard from "@/components/CompanyCard";
import Navbar from "@/components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { useCompanies } from "@/hooks/useCompanies";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { data: companies, isLoading } = useCompanies();

  const categories = [
    { title: "Строительство", icon: Building, href: "/catalog?category=Строительство", description: "Подрядчики и строительные компании" },
    { title: "Ремонт", icon: Hammer, href: "/catalog?category=Ремонт", description: "Отделочные работы и ремонт" },
    { title: "Аренда техники", icon: Truck, href: "/catalog?category=Аренда техники", description: "Спецтехника и оборудование" },
    { title: "Материалы", icon: Package, href: "/catalog?category=Материалы", description: "Поставщики строительных материалов" },
  ];

  const featuredCompanies = companies?.slice(0, 3) || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/catalog");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-background py-20 md:py-32">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Найдите надёжных подрядчиков в{" "}
              <span className="text-primary">Казахстане</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Маркетплейс строительных компаний, поставщиков материалов и аренды техники
            </p>
            
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Введите услугу или компанию..."
                  className="pl-12 h-14 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8">
                Найти
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Категории услуг</h2>
            <p className="text-lg text-muted-foreground">Выберите нужную категорию</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.title} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Популярные компании</h2>
              <p className="text-lg text-muted-foreground">Проверенные подрядчики с высоким рейтингом</p>
            </div>
            <Button variant="outline" asChild className="hidden md:flex">
              <Link to="/catalog">Все компании</Link>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card rounded-lg border p-6">
                  <Skeleton className="aspect-video rounded-lg mb-4" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : featuredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  id={company.id}
                  name={company.name}
                  description={company.description || ""}
                  city={company.city}
                  rating={Number(company.rating)}
                  reviewCount={company.review_count}
                  category={company.category}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Компании пока не зарегистрированы</p>
              <Button asChild>
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
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Разместите свою компанию
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Присоединяйтесь к BuildConnect и получайте больше заказов от клиентов по всему Казахстану
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">Начать сейчас</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-6 w-6 text-primary" />
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
                <li><a href="#" className="hover:text-primary transition-colors">Помощь</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Контакты</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">О нас</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">О проекте</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Условия использования</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 BuildConnect. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
