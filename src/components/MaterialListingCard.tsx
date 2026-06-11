import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PriceInsightBadge } from "@/components/PriceInsightBadge";
import { useTrackUserEvent } from "@/hooks/useUserEvents";
import type { Service } from "@/hooks/useServices";
import type { ListingPriceInsight } from "@/lib/priceInsight";
import { authPath } from "@/lib/authRedirect";
import { PRICE_UNIT_LABELS } from "@/lib/priceInsight";

type Props = {
  material: Service;
  priceInsight?: ListingPriceInsight;
  returnTo: string;
  user: { id: string } | null;
  canBuy: boolean;
  onOrder: (material: Service) => void;
  orderPending: boolean;
};

function formatPrice(price: number, unit?: string | null) {
  const base = new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(price);
  if (unit && unit in PRICE_UNIT_LABELS) {
    return `${base}${PRICE_UNIT_LABELS[unit as keyof typeof PRICE_UNIT_LABELS].replace("₸", "")}`;
  }
  return base;
}

export function MaterialListingCard({
  material,
  priceInsight,
  returnTo,
  user,
  canBuy,
  onOrder,
  orderPending,
}: Props) {
  const location = useLocation();
  const { track } = useTrackUserEvent();
  const cardRef = useRef<HTMLDivElement>(null);
  const listViewTrackedRef = useRef(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || listViewTrackedRef.current) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          if (timer) clearTimeout(timer);
          timer = null;
          return;
        }
        if (listViewTrackedRef.current) return;
        timer = setTimeout(() => {
          if (listViewTrackedRef.current) return;
          listViewTrackedRef.current = true;
          track("view_material", "material", material.id, {
            material_group: material.material_group || "Прочее",
            city: material.company_city,
            company_id: material.company_id,
            source: "list_impression",
          });
        }, 1500);
      },
      { threshold: 0.55 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [material.id, material.material_group, material.company_city, material.company_id, track]);

  return (
    <Card
      ref={cardRef}
      id={`material-listing-${material.id}`}
      className="group hover-lift border-2 border-transparent hover:border-primary/20 transition-all duration-300 scroll-mt-24"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="secondary" className="rounded-lg font-semibold shadow-sm">
            {material.material_group || "Прочее"}
          </Badge>
          <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg">
            <span className="font-semibold text-sm text-primary">
              {formatPrice(material.price, material.price_unit)}
            </span>
          </div>
        </div>

        <h3 className="font-bold text-lg mb-1.5 mt-3 group-hover:text-primary transition-colors line-clamp-1">
          {material.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{material.description}</p>

        {priceInsight ? <PriceInsightBadge insight={priceInsight} className="mb-4" /> : null}

        {material.company_name && (
          <div className="flex items-center gap-3 pt-3 border-t text-sm text-muted-foreground mb-4">
            <Package className="h-4 w-4" />
            <Link
              to={`/company/${material.company_id}/offerings`}
              state={{ from: `${location.pathname}${location.search}` }}
              className="font-medium hover:text-primary transition-colors"
            >
              {material.company_name}
            </Link>
            {material.company_city && (
              <div className="flex items-center gap-1 ml-auto">
                <MapPin className="h-3.5 w-3.5" />
                <span>{material.company_city}</span>
              </div>
            )}
          </div>
        )}

        {!user ? (
          <Button asChild className="w-full rounded-xl shadow-sm">
            <Link to={authPath(returnTo)}>Войти, чтобы купить</Link>
          </Button>
        ) : canBuy ? (
          <Button
            className="w-full rounded-xl shadow-sm"
            onClick={() => onOrder(material)}
            disabled={orderPending}
          >
            Купить товар
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
