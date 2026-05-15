import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTenderDateShort } from "@/lib/tenderDisplay";
import { TENDER_TYPE_LABELS, type TenderTypeValue } from "@/lib/constants";
import type { Tender } from "@/hooks/useTenders";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  tenders: Tender[];
};

export function RecommendedTendersSection({ tenders }: Props) {
  const { profile } = useAuth();

  if (tenders.length === 0) return null;

  return (
    <section className="mb-6 rounded-xl border bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-primary text-xs font-medium mb-0.5">
            <Sparkles className="h-3.5 w-3.5" />
            Для вас
          </p>
          <h2 className="text-lg font-bold">Рекомендуемые тендеры</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {profile
              ? "Подбор по городу, роли и вашим просмотрам"
              : "Войдите и откройте тендеры — блок появится после активности"}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-1">
          <Link to="/tenders">
            Все тендеры
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {tenders.map((t) => (
          <li key={t.id}>
            <Link
              to="/tenders"
              className="block rounded-lg border bg-card px-3 py-2.5 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-semibold line-clamp-2">{t.title}</span>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {TENDER_TYPE_LABELS[(t.tender_type || "other") as TenderTypeValue] ?? t.tender_type}
                </Badge>
              </div>
              {t.city && <p className="text-xs text-muted-foreground mb-1">{t.city}</p>}
              {t.deadline && (
                <p className="text-xs text-muted-foreground">
                  Срок: {formatTenderDateShort(t.deadline)}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
