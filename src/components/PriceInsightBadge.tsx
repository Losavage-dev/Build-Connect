import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatPriceInsightDelta,
  priceInsightTone,
  type ListingPriceInsight,
} from "@/lib/priceInsight";

type Props = {
  insight: ListingPriceInsight | null | undefined;
  className?: string;
};

export function PriceInsightBadge({ insight, className }: Props) {
  if (!insight) return null;

  const tone = priceInsightTone(insight.delta_pct);
  const label = formatPriceInsightDelta(insight.delta_pct);

  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs text-muted-foreground">
        Средняя на BuildConnect ({insight.city}):{" "}
        <span className="font-medium text-foreground">
          {insight.median_price.toLocaleString("ru-RU")} ₸
        </span>
        <span className="text-muted-foreground"> · {insight.listing_count} объявл.</span>
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
