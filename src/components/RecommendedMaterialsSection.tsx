import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, MapPin, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import type { RecommendedMaterialItem } from "@/hooks/useRecommendations";
import { PRICE_UNIT_LABELS } from "@/lib/priceInsight";
import { cn } from "@/lib/utils";
import { useCatalogLabel } from "@/lib/i18nCatalog";
import { useAppFormat } from "@/hooks/useAppFormat";

type Props = {
  items: RecommendedMaterialItem[];
};

function RecommendedMaterialCard({ material, reasons }: RecommendedMaterialItem) {
  const { t } = useTranslation(["marketplace", "common"]);
  const catalogLabel = useCatalogLabel();
  const { formatCurrency } = useAppFormat();

  const formatPrice = (price: number, unit?: string | null) => {
    const base = formatCurrency(price);
    if (unit && unit in PRICE_UNIT_LABELS) {
      return `${base}${PRICE_UNIT_LABELS[unit as keyof typeof PRICE_UNIT_LABELS].replace("₸", "")}`;
    }
    return base;
  };

  const groupLabel = catalogLabel(material.material_group || t("common:other"));

  return (
    <Link
      to={`/materials?listing=${encodeURIComponent(material.id)}`}
      className={cn(
        "group flex flex-col shrink-0 w-[min(100%,300px)] snap-start",
        "rounded-2xl border border-border/60 bg-card/95 backdrop-blur p-5 shadow-sm",
        "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <Badge variant="secondary" className="text-[11px] rounded-lg font-normal shrink-0">
          {groupLabel}
        </Badge>
        <span className="text-sm font-semibold text-primary shrink-0">
          {formatPrice(material.price, material.price_unit)}
        </span>
      </div>

      <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
        {material.title}
      </h3>

      {material.company_name ? (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3 truncate">
          <Package className="h-3.5 w-3.5 shrink-0" />
          {material.company_name}
        </p>
      ) : null}

      {material.company_city ? (
        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-4 flex-1">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
          {material.company_city}
        </p>
      ) : (
        <div className="flex-1 mb-4" />
      )}

      {reasons.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/50">
          {reasons.map((r) => (
            <Badge
              key={r.id}
              variant="outline"
              className="text-[10px] font-normal rounded-md px-2 py-0 h-5 border-primary/25 bg-primary/5 text-primary"
            >
              {t(`materialReasons.${r.id}`)}
            </Badge>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

export function RecommendedMaterialsSection({ items }: Props) {
  const { profile } = useAuth();
  const { t } = useTranslation(["marketplace", "common", "recommendations"]);

  if (items.length === 0) return null;

  const roleSuffix =
    profile?.role === "contractor"
      ? t("recommendations:roleContractor")
      : profile?.role === "client"
        ? t("recommendations:roleClient")
        : "";

  const subtitle = profile?.city
    ? t("materials.recommendedSubtitleCity", { city: profile.city, role: roleSuffix })
    : t("materials.recommendedSubtitleDefault");

  return (
    <section className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-widest text-primary mb-2">
            <Sparkles className="h-4 w-4" />
            {t("recommendations:forYou")}
          </p>
          <h2 className="text-xl md:text-2xl font-bold">{t("materials.recommendedTitle")}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">{subtitle}</p>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-1 rounded-xl shrink-0 self-start sm:self-auto">
          <Link to="/materials?sort=for_you">
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
          <RecommendedMaterialCard key={item.material.id} {...item} />
        ))}
      </div>
    </section>
  );
}
