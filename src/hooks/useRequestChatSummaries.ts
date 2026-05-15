import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRequests } from "@/hooks/useRequests";
import { formatChatListPreview } from "@/lib/requestChatMessage";

export type RequestChatSummary = {
  lastMessage: { preview: string; created_at: string; sender_id: string } | null;
  unreadFromOthers: number;
};

export function useRequestChatSummaries() {
  const { profile } = useAuth();
  const { data: requests } = useRequests();

  return useQuery({
    queryKey: ["request-chat-summaries", profile?.id, requests?.map((r) => r.id).sort().join(",")],
    queryFn: async (): Promise<Record<string, RequestChatSummary>> => {
      const empty: Record<string, RequestChatSummary> = {};
      if (!profile || !requests?.length) return empty;

      const ids = requests.map((r) => r.id);
      const cap = Math.min(1200, Math.max(120, ids.length * 50));

      const { data, error } = await supabase
        .from("messages")
        .select("request_id, content, created_at, sender_id, is_read")
        .in("request_id", ids)
        .order("created_at", { ascending: false })
        .limit(cap);

      if (error) throw error;

      const lastBy = new Map<string, { content: string; created_at: string; sender_id: string }>();
      const unreadBy = new Map<string, number>();

      for (const row of data || []) {
        const rid = row.request_id as string;
        if (!lastBy.has(rid)) {
          lastBy.set(rid, {
            preview: formatChatListPreview(row.content as string),
            created_at: row.created_at as string,
            sender_id: row.sender_id as string,
          });
        }
        if (row.is_read === false && row.sender_id !== profile.id) {
          unreadBy.set(rid, (unreadBy.get(rid) || 0) + 1);
        }
      }

      const out: Record<string, RequestChatSummary> = {};
      for (const r of requests) {
        out[r.id] = {
          lastMessage: lastBy.get(r.id) ?? null,
          unreadFromOthers: unreadBy.get(r.id) ?? 0,
        };
      }
      return out;
    },
    enabled: !!profile && requests !== undefined,
    staleTime: 15_000,
  });
}
