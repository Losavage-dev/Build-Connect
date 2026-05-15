import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReportTargetType } from "@/hooks/useReports";
import { appendReportEvent, notifyProfiles } from "@/lib/moderationLog";
import {
  REPORT_ESCALATION_THRESHOLD,
  REPORT_STATUS_LABELS,
  reportTargetHref,
} from "@/lib/moderationLabels";

export type ReportStatus = "new" | "reviewed" | "dismissed";
export type ModerationReportsFilter = "new" | "archive";

export interface ModerationReportRow {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  initiated_by_staff?: boolean;
  reporter?: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  };
  targetLabel?: string;
  targetHref?: string;
  companyVerificationStatus?: string | null;
  targetReportCount?: number;
  escalated?: boolean;
}

async function enrichReports(rows: ModerationReportRow[]): Promise<ModerationReportRow[]> {
  const companyIds = rows.filter((r) => r.target_type === "company").map((r) => r.target_id);
  const tenderIds = rows.filter((r) => r.target_type === "tender").map((r) => r.target_id);

  const companyNames = new Map<string, string>();
  const companyStatus = new Map<string, string>();
  const tenderTitles = new Map<string, string>();

  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name, verification_status")
      .in("id", companyIds);
    for (const c of companies || []) {
      companyNames.set(c.id, c.name);
      companyStatus.set(c.id, c.verification_status);
    }
  }

  if (tenderIds.length > 0) {
    const { data: tenders } = await supabase.from("tenders").select("id, title").in("id", tenderIds);
    for (const t of tenders || []) tenderTitles.set(t.id, t.title);
  }

  const targetKeys = [...new Set(rows.map((r) => `${r.target_type}:${r.target_id}`))];
  const countByTarget = new Map<string, number>();

  for (const key of targetKeys) {
    const [type, id] = key.split(":") as [ReportTargetType, string];
    const { count, error } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("target_type", type)
      .eq("target_id", id);
    if (!error && count != null) countByTarget.set(key, count);
  }

  return rows.map((r) => {
    const key = `${r.target_type}:${r.target_id}`;
    const targetReportCount = countByTarget.get(key) ?? 1;
    const escalated = targetReportCount >= REPORT_ESCALATION_THRESHOLD;

    if (r.target_type === "company") {
      const name = companyNames.get(r.target_id) || "Компания";
      return {
        ...r,
        targetLabel: name,
        targetHref: reportTargetHref("company", r.target_id),
        companyVerificationStatus: companyStatus.get(r.target_id) ?? null,
        targetReportCount,
        escalated,
      };
    }
    const title = tenderTitles.get(r.target_id) || "Тендер";
    return {
      ...r,
      targetLabel: title,
      targetHref: reportTargetHref("tender", r.target_id),
      targetReportCount,
      escalated,
    };
  });
}

export function useModerationReports(filter: ModerationReportsFilter = "new") {
  return useQuery({
    queryKey: ["moderation-reports", filter],
    queryFn: async () => {
      let query = supabase
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
        .order("created_at", { ascending: false });

      if (filter === "new") {
        query = query.eq("status", "new");
      } else {
        query = query.in("status", ["reviewed", "dismissed"]);
      }

      const { data, error } = await query;
      if (error) throw error;

      return enrichReports((data || []) as ModerationReportRow[]);
    },
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      moderatorProfileId,
      notify,
      targetType,
      targetId,
    }: {
      id: string;
      status: ReportStatus;
      moderatorProfileId?: string;
      notify?: { reporterId: string; ownerId?: string | null; targetLabel: string };
      targetType?: ReportTargetType;
      targetId?: string;
    }) => {
      const { error } = await supabase.from("reports").update({ status }).eq("id", id);
      if (error) throw error;

      if (moderatorProfileId && targetType && targetId) {
        await appendReportEvent({
          reportId: id,
          actorProfileId: moderatorProfileId,
          eventType: "status_change",
          summary: REPORT_STATUS_LABELS[status] || status,
        });

        await supabase.from("moderation_actions").insert({
          moderator_id: moderatorProfileId,
          action_type: "report_status_change",
          target_type: targetType,
          target_id: targetId,
          report_id: id,
          reason: REPORT_STATUS_LABELS[status] || status,
        });
      }

      if (notify && moderatorProfileId) {
        const link = `/profile?tab=report-detail&reportId=${id}`;
        const statusLabel = REPORT_STATUS_LABELS[status] || status;
        const notes: Array<{ profileId: string; title: string; body: string; link?: string }> = [
          {
            profileId: notify.reporterId,
            title: "Обновление по вашей жалобе",
            body: `«${notify.targetLabel}»: ${statusLabel}.`,
            link,
          },
        ];

        if (notify.ownerId && notify.ownerId !== notify.reporterId) {
          notes.push({
            profileId: notify.ownerId,
            title: "Решение по жалобе на ваш объект",
            body: `«${notify.targetLabel}»: ${statusLabel}.`,
            link: "/profile",
          });
        }

        await notifyProfiles(notes);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-report-detail"] });
      queryClient.invalidateQueries({ queryKey: ["report-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-journal"] });
    },
  });
}
