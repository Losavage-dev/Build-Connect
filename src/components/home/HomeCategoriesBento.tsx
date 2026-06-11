import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, FileText, Package, Wrench, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Category = {
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  href: string;
  span: string;
};

const categories: Category[] = [
  {
    titleKey: "categories.catalogTitle",
    descKey: "categories.catalogDesc",
    icon: Building2,
    href: "/catalog",
    span: "md:col-span-2 md:row-span-2",
  },
  {
    titleKey: "categories.tendersTitle",
    descKey: "categories.tendersDesc",
    icon: FileText,
    href: "/tenders",
    span: "md:col-span-1",
  },
  {
    titleKey: "categories.servicesTitle",
    descKey: "categories.servicesDesc",
    icon: Wrench,
    href: "/services",
    span: "md:col-span-1",
  },
  {
    titleKey: "categories.materialsTitle",
    descKey: "categories.materialsDesc",
    icon: Package,
    href: "/materials",
    span: "md:col-span-2",
  },
];

export function HomeCategoriesBento() {
  const { t } = useTranslation("home");

  return (
    <section className="py-20 md:py-24 bg-muted/20 border-y">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
              {t("categories.eyebrow")}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{t("categories.title")}</h2>
          </div>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4 shrink-0"
          >
            {t("featured.allCompanies")}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 auto-rows-fr">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isLarge = cat.span.includes("row-span-2");
            return (
              <Link
                key={cat.titleKey}
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
                      {t(cat.titleKey)}
                    </h3>
                    <p className={`text-muted-foreground ${isLarge ? "text-base" : "text-sm"}`}>
                      {t(cat.descKey)}
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
