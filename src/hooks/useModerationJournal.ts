import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MODERATION_ACTION_LABELS } from "@/lib/moderationLabels";

export interface ModerationJournalRow {
  id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  report_id: string | null;
  reason: string | null;
  created_at: string;
  actionLabel: string;
  moderatorName?: string;
  targetLabel?: string;
  reportHref?: string;
}

export function useModerationJournal(limit = 100) {
  return useQuery({
    queryKey: ["moderation-journal", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moderation_actions")
        .select(
          `
          id,
          action_type,
          target_type,
          target_id,
          report_id,
          reason,
          created_at,
          moderator:profiles!moderation_actions_moderator_id_fkey (first_name, last_name)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const rows = data || [];
      const companyIds = rows.filter((r) => r.target_type === "company").map((r) => r.target_id);
      const tenderIds = rows.filter((r) => r.target_type === "tender").map((r) => r.target_id);

      const companyNames = new Map<string, string>();
      const tenderTitles = new Map<string, string>();

      if (companyIds.length > 0) {
        const { data: companies } = await supabase.from("companies").select("id, name").in("id", companyIds);
        for (const c of companies || []) companyNames.set(c.id, c.name);
      }
      if (tenderIds.length > 0) {
        const { data: tenders } = await supabase.from("tenders").select("id, title").in("id", tenderIds);
        for (const t of tenders || []) tenderTitles.set(t.id, t.title);
      }

      return rows.map((r) => {
        const mod = r.moderator as { first_name: string | null; last_name: string | null } | null;
        const moderatorName = mod
          ? [mod.first_name, mod.last_name].filter(Boolean).join(" ") || "Модератор"
          : "Модератор";
        const targetLabel =
          r.target_type === "company"
            ? companyNames.get(r.target_id) || "Компания"
            : tenderTitles.get(r.target_id) || "Тендер";

        return {
          id: r.id,
          action_type: r.action_type,
          target_type: r.target_type,
          target_id: r.target_id,
          report_id: r.report_id,
          reason: r.reason,
          created_at: r.created_at,
          actionLabel: MODERATION_ACTION_LABELS[r.action_type] || r.action_type,
          moderatorName,
          targetLabel,
          reportHref: r.report_id ? `/profile?tab=report-detail&reportId=${r.report_id}` : undefined,
        } satisfies ModerationJournalRow;
      });
    },
  });
}
