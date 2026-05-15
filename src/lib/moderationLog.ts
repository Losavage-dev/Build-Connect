import { supabase } from "@/integrations/supabase/client";

export async function appendReportEvent(params: {
  reportId: string;
  actorProfileId: string | null;
  eventType: string;
  summary: string;
  meta?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("report_events").insert({
    report_id: params.reportId,
    actor_profile_id: params.actorProfileId,
    event_type: params.eventType,
    summary: params.summary,
    meta: params.meta ?? null,
  });
  if (error) throw error;
}

export async function notifyProfiles(
  items: Array<{
    profileId: string;
    title: string;
    body: string;
    link?: string;
  }>,
) {
  if (items.length === 0) return;
  const { error } = await supabase.from("notifications").insert(
    items.map((n) => ({
      recipient_id: n.profileId,
      type: "moderation",
      title: n.title,
      body: n.body,
      link: n.link ?? null,
    })),
  );
  if (error) {
    console.warn("[moderation] уведомление не отправлено:", error.message);
  }
}
