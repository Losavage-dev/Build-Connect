import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NotificationRow {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
  type: string;
}

export async function markNotificationsReadForRequest(requestId: string, profileId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("request_id", requestId)
    .eq("recipient_id", profileId)
    .is("read_at", null);
  if (error) throw error;
}

export function useMyNotifications(profileId: string | undefined) {
  return useQuery({
    queryKey: ["notifications", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, link, read_at, created_at, type")
        .eq("recipient_id", profileId!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []) as NotificationRow[];
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-counts"] });
    },
  });
}
