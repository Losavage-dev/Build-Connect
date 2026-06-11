import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Building2, Calendar, MapPin, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTenderDateShort } from "@/lib/tenderDisplay";
import { type TenderTypeValue } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import type { RecommendedTenderItem } from "@/hooks/useRecommendations";
import { cn } from "@/lib/utils";
import { useTenderTypeLabel } from "@/lib/i18nCatalog";
import { useAppFormat } from "@/hooks/useAppFormat";

type Props = {
  items: RecommendedTenderItem[];
};

const TENDER_REASON_KEYS: Record<string, string> = {
  city: "reasonCity",
  role: "reasonRole",
  interest: "reasonInterest",
  views: "reasonViews",
  deadline: "reasonDeadline",
  budget: "reasonBudget",
  new: "reasonNew",
};

function RecommendedTenderCard({ tender, reasons }: RecommendedTenderItem) {
  const { t } = useTranslation(["marketplace", "common"]);
  const tenderTypeLabel = useTenderTypeLabel();
  const { formatCurrency } = useAppFormat();

  const typeLabel =
    tenderTypeLabel((tender.tender_type || "other") as TenderTypeValue) ?? tender.tender_type;
  const budget = tender.budget ? formatCurrency(tender.budget) : null;

  return (
    <Link
      to={`/tenders?listing=${encodeURIComponent(tender.id)}`}
      className={cn(
        "group flex flex-col shrink-0 w-[min(100%,320px)] snap-start",
        "rounded-2xl border border-border/60 bg-card/95 backdrop-blur p-5 shadow-sm",
        "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <Badge variant="secondary" className="text-[11px] rounded-lg font-normal shrink-0">
          {typeLabel}
        </Badge>
        <Badge variant="outline" className="text-[11px] rounded-lg border-green-500/30 text-green-700 dark:text-green-300">
          {t("tenders.statusOpen")}
        </Badge>
      </div>

      <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors">
        {tender.title}
      </h3>

      {tender.poster_company ? (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3 truncate">
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          {tender.poster_company.name}
        </p>
      ) : null}

      <div className="space-y-1.5 text-sm text-muted-foreground mb-4 flex-1">
        {tender.city ? (
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            {tender.city}
          </p>
        ) : null}
        {budget ? (
          <p className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            {budget}
          </p>
        ) : null}
        {tender.deadline ? (
          <p className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            {t("tenders.deadlinePrefix")} {formatTenderDateShort(tender.deadline)}
          </p>
        ) : null}
      </div>

      {reasons.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/50">
          {reasons.map((r) => (
            <Badge
              key={r.id}
              variant="outline"
              className="text-[10px] font-normal rounded-md px-2 py-0 h-5 border-primary/25 bg-primary/5 text-primary"
            >
              {t(`tenders.${TENDER_REASON_KEYS[r.id] ?? r.id}`)}
            </Badge>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

export function RecommendedTendersSection({ items }: Props) {
  const { profile } = useAuth();
  const { t } = useTranslation(["marketplace", "common", "recommendations"]);

  if (items.length === 0) return null;

  const roleSuffix =
    profile?.role === "contractor"
      ? t("recommendations:roleContractor")
      : profile?.role === "supplier"
        ? t("recommendations:roleSupplier")
        : "";

  const subtitle = profile?.city
    ? t("tenders.recommendedSubtitleCity", { city: profile.city, role: roleSuffix })
    : t("tenders.recommendedSubtitleDefault");

  return (
    <section className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-widest text-primary mb-2">
            <Sparkles className="h-4 w-4" />
            {t("recommendations:forYou")}
          </p>
          <h2 className="text-xl md:text-2xl font-bold">{t("tenders.recommendedTitle")}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">{subtitle}</p>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-1 rounded-xl shrink-0 self-start sm:self-auto">
          <Link to="/tenders?sort=for_you">
            {t("common:allForYou")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div
        className={cn(
          "flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory",
          "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
        )}
      >
        {items.map((item) => (
          <RecommendedTenderCard key={item.tender.id} {...item} />
        ))}
      </div>
    </section>
  );
}
