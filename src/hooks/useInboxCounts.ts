import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRequests } from "@/hooks/useRequests";

export function useInboxCounts() {
  const { profile } = useAuth();
  const { data: requests } = useRequests();

  return useQuery({
    queryKey: ["inbox-counts", profile?.id, requests?.map((r) => r.id).join(",")],
    queryFn: async () => {
      if (!profile) return { notifications: 0, messages: 0, total: 0 };

      const { count: notifCount, error: nErr } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", profile.id)
        .is("read_at", null);

      const notifications = !nErr ? notifCount || 0 : 0;

      let messages = 0;
      if (requests && requests.length > 0) {
        const requestIds = requests.map((r) => r.id);
        const { count, error } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("request_id", requestIds)
          .eq("is_read", false)
          .neq("sender_id", profile.id);
        if (!error) messages = count || 0;
      }

      return { notifications, messages, total: notifications + messages };
    },
    enabled: !!profile,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

export function useInvalidateInboxCounts() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["inbox-counts"] });
    qc.invalidateQueries({ queryKey: ["user-unread-messages"] });
  };
}
