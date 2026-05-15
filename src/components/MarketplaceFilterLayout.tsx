import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Props = {
  filterContent: React.ReactNode;
  children: React.ReactNode;
};

/** Боковая колонка фильтров + мобильный Sheet, как на странице каталога компаний */
export function MarketplaceFilterLayout({ filterContent, children }: Props) {
  return (
    <div className="flex gap-6">
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-20 bg-card rounded-lg border p-6">
          <h2 className="font-semibold text-lg mb-4">Фильтры</h2>
          {filterContent}
        </div>
      </aside>

      <div className="flex-1">
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
              <div className="mt-6">{filterContent}</div>
            </SheetContent>
          </Sheet>
        </div>
        {children}
      </div>
    </div>
  );
}
