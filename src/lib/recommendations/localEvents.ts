import type { EntityType, UserEventType } from "./types";

const STORAGE_KEY = "bc_guest_events";
const MAX_GUEST_EVENTS = 40;

export type GuestEvent = {
  event_type: UserEventType;
  entity_type: EntityType;
  entity_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};

export function readGuestEvents(): GuestEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendGuestEvent(
  event_type: UserEventType,
  entity_type: EntityType,
  entity_id: string,
  metadata?: Record<string, unknown>,
) {
  const next: GuestEvent = {
    event_type,
    entity_type,
    entity_id,
    metadata,
    created_at: new Date().toISOString(),
  };
  const list = [next, ...readGuestEvents()].slice(0, MAX_GUEST_EVENTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
