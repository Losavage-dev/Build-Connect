import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { priceInsightTone, type ListingPriceInsight } from "@/lib/priceInsight";
import { useAppFormat } from "@/hooks/useAppFormat";
import { useCatalogLabel } from "@/lib/i18nCatalog";

type Props = {
  insight: ListingPriceInsight | null | undefined;
  className?: string;
};

export function PriceInsightBadge({ insight, className }: Props) {
  const { t } = useTranslation("common");
  const { formatNumber } = useAppFormat();
  const catalogLabel = useCatalogLabel();

  if (!insight) return null;

  const tone = priceInsightTone(insight.delta_pct);
  const absPct = Math.abs(insight.delta_pct).toFixed(0);
  const label =
    insight.delta_pct <= -0.5
      ? t("priceInsight.belowAverage", { pct: absPct })
      : insight.delta_pct >= 0.5
        ? t("priceInsight.aboveAverage", { pct: absPct })
        : t("priceInsight.nearAverage");

  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs text-muted-foreground">
        {t("priceInsight.average", { city: catalogLabel(insight.city) || insight.city })}{" "}
        <span className="font-medium text-foreground">
          {formatNumber(insight.median_price)} {t("currencyKzt")}
        </span>
        <span className="text-muted-foreground"> · {t("priceInsight.listings", { count: insight.listing_count })}</span>
      </p>
      <Badge
        variant="outline"
        className={cn(
          "text-xs font-normal",
          tone === "good" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
          tone === "bad" && "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400",
          tone === "neutral" && "text-muted-foreground",
        )}
      >
        {label}
      </Badge>
    </div>
  );
}
