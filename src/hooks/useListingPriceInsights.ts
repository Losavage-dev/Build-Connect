import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ListingPriceInsight } from "@/lib/priceInsight";

export function useListingPriceInsights(serviceIds: string[]) {
  const sorted = [...serviceIds].sort().join(",");

  return useQuery({
    queryKey: ["listing-price-insights", sorted],
    queryFn: async () => {
      if (!serviceIds.length) return {} as Record<string, ListingPriceInsight>;
      const { data, error } = await supabase
        .from("listing_price_insights")
        .select("*")
        .in("service_id", serviceIds);
      if (error) throw error;
      const map: Record<string, ListingPriceInsight> = {};
      for (const row of data || []) {
        map[row.service_id] = row as ListingPriceInsight;
      }
      return map;
    },
    enabled: serviceIds.length > 0,
    staleTime: 30_000,
  });
}
