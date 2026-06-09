import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PriceUnit } from "@/lib/priceInsight";

export type MarketProduct = {
  id: string;
  slug: string;
  name: string;
  material_group: string;
  price_unit: PriceUnit;
  unit_label: string;
};

export function useMarketProducts() {
  return useQuery({
    queryKey: ["market-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_products")
        .select("id, slug, name, material_group, price_unit, unit_label")
        .eq("is_active", true)
        .order("material_group")
        .order("name");
      if (error) throw error;
      return (data || []) as MarketProduct[];
    },
    staleTime: 60_000,
  });
}

export function findMarketProductByName(products: MarketProduct[] | undefined, name: string) {
  if (!products?.length || !name.trim()) return null;
  const trimmed = name.trim();
  return products.find((p) => p.name === trimmed) ?? null;
}
