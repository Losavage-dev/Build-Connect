import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVE_DEAL_STATUSES } from "@/lib/requestWorkflow";

/** Карта tenderId → requestId для активных откликов текущего пользователя. */
export function useMyActiveTenderBids(profileId: string | undefined) {
  return useQuery({
    queryKey: ["my-active-tender-bids", profileId],
    queryFn: async (): Promise<Map<string, string>> => {
      if (!profileId) return new Map();

      const { data, error } = await supabase
        .from("requests")
        .select("id, source_tender_id")
        .eq("client_id", profileId)
        .not("source_tender_id", "is", null)
        .in("status", ACTIVE_DEAL_STATUSES);

      if (error) throw error;

      const map = new Map<string, string>();
      for (const row of data ?? []) {
        if (row.source_tender_id) {
          map.set(row.source_tender_id, row.id);
        }
      }
      return map;
    },
    enabled: !!profileId,
  });
}
