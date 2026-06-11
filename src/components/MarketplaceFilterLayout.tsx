import { Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Props = {
  filterContent: React.ReactNode;
  children: React.ReactNode;
};

/** Боковая колонка фильтров + мобильный Sheet — стиль главной страницы. */
export function MarketplaceFilterLayout({ filterContent, children }: Props) {
  const { t } = useTranslation("common");

  return (
    <div className="flex gap-6 lg:gap-8">
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
        <div className="sticky top-20 rounded-2xl border border-border/60 bg-card/90 backdrop-blur p-6 shadow-sm">
          <h2 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-4">
            {t("filters")}
          </h2>
          {filterContent}
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="lg:hidden mb-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full rounded-xl">
                <Filter className="h-4 w-4 mr-2" />
                {t("filters")}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="rounded-r-2xl">
              <SheetHeader>
                <SheetTitle>{t("filters")}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{filterContent}</div>
            </SheetContent>
          </Sheet>
        </div>
        {children}
      </div>
    </div>
  );
}
