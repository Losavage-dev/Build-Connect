import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRequests } from "@/hooks/useRequests";

/**
 * Подписка Realtime: уведомления в БД + сообщения по заявкам пользователя.
 * Счётчики и списки обновляются без перезагрузки (при включённой публикации supabase_realtime).
 */
export function useInboxRealtime() {
  const { profile } = useAuth();
  const { data: requests } = useRequests();
  const queryClient = useQueryClient();

  const requestIdsKey = useMemo(
    () =>
      (requests ?? [])
        .map((r) => r.id)
        .sort()
        .join(","),
    [requests],
  );

  useEffect(() => {
    if (!profile?.id) return;

    const requestIds = requestIdsKey.length > 0 ? requestIdsKey.split(",") : [];

    const channelName = `inbox-${profile.id}`;
    const ch = supabase.channel(channelName);

    ch.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `recipient_id=eq.${profile.id}`,
      },
      (payload) => {
        const row = payload.new as { title?: string; body?: string | null; type?: string };
        if (row.type === "new_message") {
          return;
        }
        const title = row.title || "Уведомление";
        const body = row.body?.trim();
        if (row.type === "new_request") {
          toast.message(title, { description: body || "Новая заявка по компании." });
        } else {
          toast.message(title, { description: body || undefined });
        }
        queryClient.invalidateQueries({ queryKey: ["inbox-counts"] });
      },
    );

    for (const rid of requestIds) {
      ch.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${rid}`,
        },
        (payload) => {
          const row = payload.new as { sender_id?: string; content?: string };
          queryClient.invalidateQueries({ queryKey: ["inbox-counts"] });
          queryClient.invalidateQueries({ queryKey: ["request-chat-summaries"] });
          queryClient.invalidateQueries({ queryKey: ["messages", rid] });
          if (row.sender_id && row.sender_id !== profile.id) {
            const preview = (row.content || "").trim().slice(0, 160);
            toast.message("Новое сообщение", {
              description: preview || "Откройте чат в разделе «Заявки и чаты».",
            });
          }
        },
      );

      ch.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${rid}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["inbox-counts"] });
          queryClient.invalidateQueries({ queryKey: ["request-chat-summaries"] });
        },
      );
    }

    ch.subscribe((status, err) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn("[useInboxRealtime] channel", status, err);
      }
    });

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [profile?.id, requestIdsKey, queryClient]);
}
