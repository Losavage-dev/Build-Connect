import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { appendReportEvent, notifyProfiles } from "@/lib/moderationLog";
import { ownerWarningObjectLabel } from "@/lib/moderationLabels";
import { resolveReportParties } from "@/hooks/useModeratorActions";

export interface TargetOwnerProfile {
  id: string;
  banned_until: string | null;
  ban_reason: string | null;
  first_name: string | null;
  last_name: string | null;
}

export function useTargetOwnerProfile(targetType: "company" | "tender", targetId: string) {
  return useQuery({
    queryKey: ["target-owner-profile", targetType, targetId],
    queryFn: async (): Promise<TargetOwnerProfile | null> => {
      let ownerId: string | null = null;
      if (targetType === "company") {
        const { data } = await supabase.from("companies").select("owner_id").eq("id", targetId).maybeSingle();
        ownerId = data?.owner_id ?? null;
      } else {
        const { data } = await supabase.from("tenders").select("client_id").eq("id", targetId).maybeSingle();
        ownerId = data?.client_id ?? null;
      }
      if (!ownerId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, banned_until, ban_reason, first_name, last_name")
        .eq("id", ownerId)
        .maybeSingle();
      if (error) throw error;
      return data as TargetOwnerProfile | null;
    },
  });
}

export function isProfileBanned(owner: TargetOwnerProfile | null | undefined): boolean {
  if (!owner?.banned_until) return false;
  return new Date(owner.banned_until) > new Date();
}

export function useSendOwnerWarning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetType,
      targetId,
      targetLabel,
      moderatorProfileId,
      message,
      reportId,
    }: {
      targetType: "company" | "tender";
      targetId: string;
      targetLabel: string;
      moderatorProfileId: string;
      message: string;
      reportId?: string;
    }) => {
      const text = message.trim();
      if (!text) throw new Error("Введите текст предупреждения");

      const { data: ownerRow } =
        targetType === "company"
          ? await supabase.from("companies").select("owner_id").eq("id", targetId).maybeSingle()
          : await supabase.from("tenders").select("client_id").eq("id", targetId).maybeSingle();

      const ownerId =
        targetType === "company"
          ? (ownerRow as { owner_id?: string } | null)?.owner_id
          : (ownerRow as { client_id?: string } | null)?.client_id;

      if (!ownerId) throw new Error("Не найден владелец объекта");

      const objectPhrase = ownerWarningObjectLabel(targetType);
      const manageLink =
        targetType === "company" ? `/company/${targetId}/manage` : `/tenders?listing=${targetId}`;

      await notifyProfiles([
        {
          profileId: ownerId,
          title: "Предупреждение модератора",
          body: `По ${objectPhrase} «${targetLabel}»: ${text}. Примите меры, если это необходимо.`,
          link: manageLink,
        },
      ]);

      const { error: logErr } = await supabase.from("moderation_actions").insert({
        moderator_id: moderatorProfileId,
        action_type: "owner_warning",
        target_type: targetType,
        target_id: targetId,
        report_id: reportId || null,
        reason: text,
      });
      if (logErr) throw logErr;

      if (reportId) {
        await appendReportEvent({
          reportId,
          actorProfileId: moderatorProfileId,
          eventType: "owner_warning",
          summary: "Отправлено предупреждение владельцу",
          meta: { message: text },
        });
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["moderation-journal"] });
      queryClient.invalidateQueries({ queryKey: ["report-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["target-owner-profile", vars.targetType, vars.targetId] });
    },
  });
}

export function useUnbanProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profileId,
      moderatorProfileId,
      reason,
      reportId,
      targetType,
      targetId,
      targetLabel,
    }: {
      profileId: string;
      moderatorProfileId: string;
      reason?: string;
      reportId?: string;
      targetType: "company" | "tender";
      targetId: string;
      targetLabel: string;
    }) => {
      const { error: unbanErr } = await supabase.rpc("moderator_clear_profile_ban", {
        p_profile_id: profileId,
      });
      if (unbanErr) throw unbanErr;

      const comment = reason?.trim() || "Блокировка снята модератором";

      const { error: logErr } = await supabase.from("moderation_actions").insert({
        moderator_id: moderatorProfileId,
        action_type: "profile_unban",
        target_type: "profile",
        target_id: profileId,
        report_id: reportId || null,
        reason: comment,
      });
      if (logErr) throw logErr;

      if (reportId) {
        await appendReportEvent({
          reportId,
          actorProfileId: moderatorProfileId,
          eventType: "profile_unban",
          summary: "Блокировка владельца снята",
        });
      }

      await notifyProfiles([
        {
          profileId,
          title: "Блокировка снята",
          body: `Доступ к аккаунту восстановлен. Объект: «${targetLabel}».`,
          link: "/profile",
        },
      ]);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["moderation-journal"] });
      queryClient.invalidateQueries({ queryKey: ["report-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["target-owner-profile", vars.targetType, vars.targetId] });
    },
  });
}
