import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  appendGuestEvent,
  readGuestEvents,
  type EntityType,
  type UserEventType,
} from "@/lib/recommendations";

export function useUserEvents(limit = 80) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["user-events", profile?.id, limit],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("user_events")
        .select("event_type, entity_type, entity_id, metadata, created_at")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.id,
    staleTime: 60_000,
  });
}

export function useTrackUserEvent() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: {
      event_type: UserEventType;
      entity_type: EntityType;
      entity_id: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!profile?.id) {
        appendGuestEvent(
          payload.event_type,
          payload.entity_type,
          payload.entity_id,
          payload.metadata,
        );
        return;
      }
      const { error } = await supabase.from("user_events").insert({
        profile_id: profile.id,
        event_type: payload.event_type,
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        metadata: payload.metadata ?? {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: ["user-events", profile.id] });
      }
    },
  });

  const track = useCallback(
    (
      event_type: UserEventType,
      entity_type: EntityType,
      entity_id: string,
      metadata?: Record<string, unknown>,
    ) => {
      mutation.mutate({ event_type, entity_type, entity_id, metadata });
    },
    [mutation],
  );

  return { track, isPending: mutation.isPending };
}

export function useGuestEvents() {
  return readGuestEvents();
}
