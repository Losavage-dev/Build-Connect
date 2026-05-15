import { supabase } from "@/integrations/supabase/client";
import { appendGuestEvent, type EntityType, type UserEventType } from "@/lib/recommendations";

/** Fire-and-forget: не блокирует UI при ошибке сети */
export function trackUserEvent(
  profileId: string | null | undefined,
  event_type: UserEventType,
  entity_type: EntityType,
  entity_id: string,
  metadata?: Record<string, unknown>,
) {
  if (!entity_id) return;

  if (!profileId) {
    appendGuestEvent(event_type, entity_type, entity_id, metadata);
    return;
  }

  void supabase
    .from("user_events")
    .insert({
      profile_id: profileId,
      event_type,
      entity_type,
      entity_id,
      metadata: metadata ?? {},
    })
    .then(({ error }) => {
      if (error) console.warn("[recommendations] track:", error.message);
    });
}
