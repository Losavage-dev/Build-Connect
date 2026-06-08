import { Link } from "react-router-dom";
import { Building, Hammer, Truck, Package, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Category = {
  title: string;
  icon: LucideIcon;
  href: string;
  description: string;
  span: string;
};

const categories: Category[] = [
  {
    title: "Строительство",
    icon: Building,
    href: "/catalog?category=Строительство",
    description: "Генподряд, новое строительство и крупные объекты",
    span: "md:col-span-2 md:row-span-2",
  },
  {
    title: "Ремонт",
    icon: Hammer,
    href: "/catalog?category=Ремонт",
    description: "Отделка и ремонт",
    span: "md:col-span-1",
  },
  {
    title: "Аренда техники",
    icon: Truck,
    href: "/catalog?category=Аренда спецтехники",
    description: "Спецтехника",
    span: "md:col-span-1",
  },
  {
    title: "Материалы",
    icon: Package,
    href: "/catalog?category=Материалы",
    description: "Поставщики и опт",
    span: "md:col-span-2",
  },
];

export function HomeCategoriesBento() {
  return (
    <section className="py-20 md:py-24 bg-muted/20 border-y">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
              Направления
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Категории отрасли</h2>
            <p className="text-muted-foreground text-lg max-w-lg">
              Перейдите в каталог с фильтром по типу работ и специализации компаний.
            </p>
          </div>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4 shrink-0"
          >
            Весь каталог
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 auto-rows-fr">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isLarge = cat.span.includes("row-span-2");
            return (
              <Link
                key={cat.title}
                to={cat.href}
                className={`group relative overflow-hidden rounded-2xl border-2 border-border/50 bg-card hover:border-primary/30 hover-lift ${cat.span}`}
              >
                <div className="absolute inset-0 blueprint-grid opacity-30 pointer-events-none" />
                <div
                  className={`relative flex flex-col justify-between h-full ${
                    isLarge ? "p-8 md:p-10 min-h-[280px]" : "p-6 min-h-[140px]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`rounded-2xl bg-primary/10 p-3 group-hover:bg-primary transition-colors duration-300 ${
                        isLarge ? "p-4" : ""
                      }`}
                    >
                      <Icon
                        className={`text-primary group-hover:text-primary-foreground transition-colors ${
                          isLarge ? "h-9 w-9" : "h-7 w-7"
                        }`}
                      />
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="mt-auto pt-6">
                    <h3 className={`font-bold mb-1 ${isLarge ? "text-2xl md:text-3xl" : "text-lg"}`}>
                      {cat.title}
                    </h3>
                    <p className={`text-muted-foreground ${isLarge ? "text-base" : "text-sm"}`}>
                      {cat.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
