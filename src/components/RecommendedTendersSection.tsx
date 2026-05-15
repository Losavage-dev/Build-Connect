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
    <section className="mb-10 rounded-2xl border bg-primary/5 p-6">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <p className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-1">
            <Sparkles className="h-4 w-4" />
            Для вас
          </p>
          <h2 className="text-xl font-bold">Рекомендуемые тендеры</h2>
          <p className="text-sm text-muted-foreground">
            {profile
              ? "Город, роль и ваши просмотры учитываются при подборе"
              : "Откройте тендеры — рекомендации улучшатся"}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-1">
          <Link to="/tenders">
            Все тендеры
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {tenders.map((t) => (
          <li key={t.id}>
            <Link
              to="/tenders"
              className="block rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors"
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
