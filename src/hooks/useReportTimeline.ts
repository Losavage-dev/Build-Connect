import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  MODERATION_ACTION_LABELS,
  REPORT_ESCALATION_THRESHOLD,
  REPORT_STATUS_LABELS,
} from "@/lib/moderationLabels";
import type { ModerationReportRow } from "@/hooks/useModerationReports";

export interface TimelineEntry {
  id: string;
  at: string;
  kind: "report" | "event" | "action" | "verification";
  title: string;
  detail?: string | null;
  actorName?: string;
}

export function useModerationReportDetail(reportId: string | null) {
  return useQuery({
    queryKey: ["moderation-report-detail", reportId],
    enabled: !!reportId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(
          `
          id,
          reporter_id,
          target_type,
          target_id,
          reason,
          details,
          status,
          created_at,
          initiated_by_staff,
          reporter:profiles!reports_reporter_id_fkey (first_name, last_name, phone)
        `,
        )
        .eq("id", reportId!)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const row = data as ModerationReportRow;
      let targetLabel = "Объект";
      let targetHref: string | undefined;
      let companyVerificationStatus: string | null = null;

      if (row.target_type === "company") {
        const { data: c } = await supabase
          .from("companies")
          .select("name, verification_status")
          .eq("id", row.target_id)
          .maybeSingle();
        targetLabel = c?.name || "Компания";
        companyVerificationStatus = c?.verification_status ?? null;
        targetHref = `/company/${row.target_id}`;
      } else {
        const { data: t } = await supabase.from("tenders").select("title").eq("id", row.target_id).maybeSingle();
        targetLabel = t?.title || "Тендер";
        targetHref = `/tenders?listing=${encodeURIComponent(row.target_id)}`;
      }

      const { count } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("target_type", row.target_type)
        .eq("target_id", row.target_id);

      const targetReportCount = count ?? 1;

      return {
        ...row,
        targetLabel,
        targetHref,
        companyVerificationStatus,
        targetReportCount,
        escalated: targetReportCount >= REPORT_ESCALATION_THRESHOLD,
      } satisfies ModerationReportRow;
    },
  });
}

export function useReportTimeline(reportId: string | null) {
  return useQuery({
    queryKey: ["report-timeline", reportId],
    enabled: !!reportId,
    queryFn: async () => {
      const { data: report, error: repErr } = await supabase
        .from("reports")
        .select("id, created_at, reason, details, status, target_type, target_id")
        .eq("id", reportId!)
        .maybeSingle();
      if (repErr) throw repErr;
      if (!report) return [] as TimelineEntry[];

      const entries: TimelineEntry[] = [
        {
          id: `report-${report.id}`,
          at: report.created_at,
          kind: "report",
          title: "Жалоба создана",
          detail: report.reason + (report.details ? ` — ${report.details}` : ""),
        },
      ];

      const { data: events } = await supabase
        .from("report_events")
        .select(
          `
          id,
          event_type,
          summary,
          created_at,
          actor:profiles!report_events_actor_profile_id_fkey (first_name, last_name)
        `,
        )
        .eq("report_id", reportId!)
        .order("created_at", { ascending: true });

      for (const e of events || []) {
        const actor = e.actor as { first_name: string | null; last_name: string | null } | null;
        entries.push({
          id: e.id,
          at: e.created_at,
          kind: "event",
          title: e.summary,
          actorName: actor ? [actor.first_name, actor.last_name].filter(Boolean).join(" ") : undefined,
        });
      }

      const { data: actions } = await supabase
        .from("moderation_actions")
        .select(
          `
          id,
          action_type,
          reason,
          created_at,
          moderator:profiles!moderation_actions_moderator_id_fkey (first_name, last_name)
        `,
        )
        .eq("report_id", reportId!)
        .order("created_at", { ascending: true });

      for (const a of actions || []) {
        const mod = a.moderator as { first_name: string | null; last_name: string | null } | null;
        entries.push({
          id: a.id,
          at: a.created_at,
          kind: "action",
          title: MODERATION_ACTION_LABELS[a.action_type] || a.action_type,
          detail: a.reason,
          actorName: mod ? [mod.first_name, mod.last_name].filter(Boolean).join(" ") : undefined,
        });
      }

      if (report.target_type === "company") {
        const { data: reviews } = await supabase
          .from("company_verification_reviews")
          .select(
            `
            id,
            decision,
            comment,
            created_at,
            moderator:profiles!company_verification_reviews_moderator_id_fkey (first_name, last_name)
          `,
          )
          .eq("company_id", report.target_id)
          .order("created_at", { ascending: true });

        const reportCreated = new Date(report.created_at).getTime();
        for (const rv of reviews || []) {
          const at = new Date(rv.created_at).getTime();
          if (at < reportCreated - 60_000) continue;
          const mod = rv.moderator as { first_name: string | null; last_name: string | null } | null;
          entries.push({
            id: rv.id,
            at: rv.created_at,
            kind: "verification",
            title: `Верификация: ${rv.decision}`,
            detail: rv.comment,
            actorName: mod ? [mod.first_name, mod.last_name].filter(Boolean).join(" ") : undefined,
          });
        }
      }

      if (report.status !== "new") {
        entries.push({
          id: `status-${report.status}`,
          at: report.created_at,
          kind: "event",
          title: REPORT_STATUS_LABELS[report.status] || report.status,
        });
      }

      entries.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
      return entries;
    },
  });
}
