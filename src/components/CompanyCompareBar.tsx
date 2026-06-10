import { Link, useNavigate } from "react-router-dom";
import { GitCompare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { companyCompareIdsParam } from "@/lib/companyCompare";
import { useCompanyCompare } from "@/hooks/useCompanyCompare";

export function CompanyCompareBar() {
  const navigate = useNavigate();
  const { entries, count, canCompare, remove, clear } = useCompanyCompare();

  if (count === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      <div className="container px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium shrink-0">
          <GitCompare className="h-4 w-4 text-primary" />
          Сравнение: {count}/3
        </div>

        <div className="flex flex-wrap gap-2 flex-1 min-w-0">
          {entries.map((entry) => (
            <Badge key={entry.id} variant="secondary" className="rounded-lg pl-2.5 pr-1 py-1 gap-1 max-w-[14rem]">
              <span className="truncate">{entry.name}</span>
              <button
                type="button"
                className="rounded-md p-0.5 hover:bg-muted"
                aria-label={`Убрать ${entry.name} из сравнения`}
                onClick={() => remove(entry.id)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex gap-2 shrink-0">
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={clear}>
            Очистить
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-xl"
            disabled={!canCompare}
            onClick={() => navigate(`/catalog/compare?ids=${companyCompareIdsParam(entries)}`)}
          >
            Сравнить
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Кнопка «Добавить в сравнение» для профиля компании */
export function CompanyCompareToggleButton({
  companyId,
  companyName,
}: {
  companyId: string;
  companyName: string;
}) {
  const { isSelected, toggle, isFull } = useCompanyCompare();
  const selected = isSelected(companyId);

  return (
    <Button
      type="button"
      variant={selected ? "secondary" : "outline"}
      size="sm"
      className="rounded-xl"
      disabled={!selected && isFull}
      onClick={() => toggle({ id: companyId, name: companyName })}
    >
      <GitCompare className="h-4 w-4 mr-2" />
      {selected ? "В сравнении" : "В сравнение"}
    </Button>
  );
}

/** Ссылка на сравнение в шапке каталога */
export function CompanyCompareLink() {
  const { count, entries, canCompare } = useCompanyCompare();

  if (count === 0) return null;

  return (
    <Button asChild variant="outline" size="sm" className="rounded-xl" disabled={!canCompare}>
      <Link to={canCompare ? `/catalog/compare?ids=${companyCompareIdsParam(entries)}` : "#"}>
        <GitCompare className="h-4 w-4 mr-2" />
        Сравнить ({count})
      </Link>
    </Button>
  );
}
