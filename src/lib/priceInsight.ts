export type PriceUnit = "m2" | "m3" | "ton" | "piece" | "bag" | "lm";

export const PRICE_UNIT_LABELS: Record<PriceUnit, string> = {
  m2: "₸/м²",
  m3: "₸/м³",
  ton: "₸/т",
  piece: "₸/шт",
  bag: "₸/мешок",
  lm: "₸/п.м",
};

export type ListingPriceInsight = {
  service_id: string;
  city: string;
  market_product_id: string;
  listing_price: number;
  median_price: number;
  delta_pct: number;
  listing_count: number;
  computed_at: string;
};

export function formatPriceInsightDelta(deltaPct: number): string {
  if (deltaPct <= -0.5) return `${Math.abs(deltaPct).toFixed(0)}% ниже среднего`;
  if (deltaPct >= 0.5) return `${deltaPct.toFixed(0)}% выше среднего`;
  return "около среднего";
}

export function priceInsightTone(deltaPct: number): "good" | "bad" | "neutral" {
  if (deltaPct <= -3) return "good";
  if (deltaPct >= 8) return "bad";
  return "neutral";
}
