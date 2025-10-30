import { useState } from "react";
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

const Catalog = () => {
  const [city, setCity] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  const companies = [
    {
      id: "1",
      name: "СтройМастер KZ",
      description: "Полный цикл строительных работ. Жилые и коммерческие объекты.",
      city: "Алматы",
      rating: 4.8,
      reviewCount: 156,
      category: "Строительство",
    },
    {
      id: "2",
      name: "АлемСтрой",
      description: "Современные решения в строительстве и проектировании.",
      city: "Астана",
      rating: 4.9,
      reviewCount: 203,
      category: "Строительство",
    },
    {
      id: "3",
      name: "РемонтПро",
      description: "Качественный ремонт квартир и офисов под ключ.",
      city: "Шымкент",
      rating: 4.7,
      reviewCount: 89,
      category: "Ремонт",
    },
    {
      id: "4",
      name: "ТехноСтрой",
      description: "Аренда строительной техники и оборудования по доступным ценам.",
      city: "Алматы",
      rating: 4.6,
      reviewCount: 124,
      category: "Аренда техники",
    },
    {
      id: "5",
      name: "МатериалСнаб",
      description: "Оптовые поставки строительных материалов по всему Казахстану.",
      city: "Астана",
      rating: 4.8,
      reviewCount: 278,
      category: "Материалы",
    },
    {
      id: "6",
      name: "ЭлитРемонт",
      description: "Премиум ремонт элитных квартир и коттеджей.",
      city: "Алматы",
      rating: 4.9,
      reviewCount: 167,
      category: "Ремонт",
    },
  ];

  const cities = ["Алматы", "Астана", "Шымкент", "Караганда", "Актобе"];
  const categories = ["Строительство", "Ремонт", "Аренда техники", "Материалы"];

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
              <SelectItem key={c} value={c.toLowerCase()}>
                {c}
              </SelectItem>
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
              <SelectItem key={cat} value={cat.toLowerCase()}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => {
          setCity("");
          setCategory("");
        }}
      >
        Сбросить фильтры
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Каталог компаний</h1>
          <p className="text-lg text-muted-foreground">
            Найдено {companies.length} компаний
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
                placeholder="Поиск по названию или описанию..."
                className="max-w-md"
              />
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {companies.map((company) => (
                <CompanyCard key={company.id} {...company} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
