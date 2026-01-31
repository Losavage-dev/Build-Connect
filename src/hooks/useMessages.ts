import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export function useMessages(requestId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", requestId],
    queryFn: async () => {
      if (!requestId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles (first_name, last_name, avatar_url)
        `)
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!requestId,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`messages-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", requestId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, queryClient]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ request_id, content }: { request_id: string; content: string }) => {
      if (!profile) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          request_id,
          sender_id: profile.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.request_id] });
    },
  });
}
