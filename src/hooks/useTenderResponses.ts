import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Request } from "@/hooks/useRequests";

export type TenderResponse = Request;

const RESPONSE_SELECT = `
  *,
  company:companies (name, logo_url),
  client:profiles!requests_client_id_fkey (first_name, last_name, avatar_url)
`;

export function tenderBidTitle(tenderTitle: string): string {
  return `Отклик на тендер: ${tenderTitle}`;
}

export function useTenderResponses(tenderId: string | undefined, tenderTitle: string | undefined) {
  return useQuery({
    queryKey: ["tender-responses", tenderId, tenderTitle],
    queryFn: async (): Promise<TenderResponse[]> => {
      if (!tenderId) return [];

      const { data: byTender, error: err1 } = await supabase
        .from("requests")
        .select(RESPONSE_SELECT)
        .eq("source_tender_id", tenderId)
        .order("created_at", { ascending: false });

      if (err1) throw err1;
      if (byTender?.length) return byTender as TenderResponse[];

      if (!tenderTitle?.trim()) return [];

      const { data: legacy, error: err2 } = await supabase
        .from("requests")
        .select(RESPONSE_SELECT)
        .eq("title", tenderBidTitle(tenderTitle.trim()))
        .order("created_at", { ascending: false });

      if (err2) throw err2;
      return (legacy ?? []) as TenderResponse[];
    },
    enabled: !!tenderId,
  });
}
