import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ListingPriceInsight } from "@/lib/priceInsight";

const CHUNK_SIZE = 80;

async function fetchInsightsChunk(ids: string[]) {
  const { data, error } = await supabase
    .from("listing_price_insights")
    .select("*")
    .in("service_id", ids);
  if (error) throw error;
  return data ?? [];
}

export function useListingPriceInsights(serviceIds: string[]) {
  const sorted = [...serviceIds].sort().join(",");

  return useQuery({
    queryKey: ["listing-price-insights", sorted],
    queryFn: async () => {
      if (!serviceIds.length) return {} as Record<string, ListingPriceInsight>;
      const map: Record<string, ListingPriceInsight> = {};
      for (let i = 0; i < serviceIds.length; i += CHUNK_SIZE) {
        const chunk = serviceIds.slice(i, i + CHUNK_SIZE);
        const rows = await fetchInsightsChunk(chunk);
        for (const row of rows) {
          map[row.service_id] = row as ListingPriceInsight;
        }
      }
      return map;
    },
    enabled: serviceIds.length > 0,
    staleTime: 30_000,
  });
}
