import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import { appendReportEvent, notifyProfiles } from "@/lib/moderationLog";

import { REPORT_STATUS_LABELS } from "@/lib/moderationLabels";



export type ModeratorActionType =

  | "company_suspend"

  | "company_restore"

  | "company_revoke_verified"

  | "tender_close"

  | "profile_ban";



type NotifyParties = {

  ownerProfileId?: string | null;

  reporterProfileId?: string | null;

  targetLabel: string;

  reportId?: string;

};



type BasePayload = {

  moderatorProfileId: string;

  reason: string;

  reportId?: string;

  closeReportAsReviewed?: boolean;

  notify?: NotifyParties;

};



async function logModerationAction(params: {

  moderatorProfileId: string;

  actionType: ModeratorActionType | "report_status_change";

  targetType: string;

  targetId: string;

  reportId?: string | null;

  reason: string;

}) {

  const { error } = await supabase.from("moderation_actions").insert({

    moderator_id: params.moderatorProfileId,

    action_type: params.actionType,

    target_type: params.targetType,

    target_id: params.targetId,

    report_id: params.reportId || null,

    reason: params.reason,

  });

  if (error) throw error;

}



async function afterModerationNotify(

  notify: NotifyParties | undefined,

  ownerTitle: string,

  ownerBody: string,

  reporterTitle: string,

  reporterBody: string,

) {

  if (!notify) return;

  const items: Array<{ profileId: string; title: string; body: string; link?: string }> = [];

  const link = notify.reportId ? `/profile?tab=report-detail&reportId=${notify.reportId}` : "/profile";



  if (notify.ownerProfileId) {

    items.push({ profileId: notify.ownerProfileId, title: ownerTitle, body: ownerBody, link: "/profile" });

  }

  if (notify.reporterProfileId && notify.reporterProfileId !== notify.ownerProfileId) {

    items.push({

      profileId: notify.reporterProfileId,

      title: reporterTitle,

      body: reporterBody,

      link,

    });

  }

  await notifyProfiles(items);

}



async function closeReportIfNeeded(

  reportId: string | undefined,

  close: boolean,

  moderatorProfileId: string,

) {

  if (!reportId || !close) return;

  const { error } = await supabase.from("reports").update({ status: "reviewed" }).eq("id", reportId);

  if (error) throw error;

  await appendReportEvent({

    reportId,

    actorProfileId: moderatorProfileId,

    eventType: "status_change",

    summary: REPORT_STATUS_LABELS.reviewed,

  });

}



export function useSuspendCompany() {

  const queryClient = useQueryClient();



  return useMutation({

    mutationFn: async ({

      companyId,

      moderatorProfileId,

      reason,

      reportId,

      closeReportAsReviewed = true,

      notify,

    }: BasePayload & { companyId: string }) => {

      const comment = reason.trim();

      if (!comment) throw new Error("Укажите причину");



      const { error: companyErr } = await supabase

        .from("companies")

        .update({

          verification_status: "suspended",

          rejection_reason: comment,

        })

        .eq("id", companyId);



      if (companyErr) throw companyErr;



      const { error: reviewErr } = await supabase.from("company_verification_reviews").insert({

        company_id: companyId,

        moderator_id: moderatorProfileId,

        decision: "suspended",

        comment,

      });

      if (reviewErr) throw reviewErr;



      await logModerationAction({

        moderatorProfileId,

        actionType: "company_suspend",

        targetType: "company",

        targetId: companyId,

        reportId,

        reason: comment,

      });



      if (reportId) {

        await appendReportEvent({

          reportId,

          actorProfileId: moderatorProfileId,

          eventType: "company_suspend",

          summary: "Компания скрыта из каталога",

          meta: { companyId },

        });

      }



      await closeReportIfNeeded(reportId, closeReportAsReviewed, moderatorProfileId);



      await afterModerationNotify(

        notify,

        "Компания скрыта модератором",

        `«${notify?.targetLabel || "Компания"}» скрыта из каталога. Причина: ${comment}`,

        "Жалоба обработана",

        `По вашей жалобе на «${notify?.targetLabel || "объект"}» приняты меры: компания скрыта.`,

      );

    },

    onSuccess: (_, vars) => {

      queryClient.invalidateQueries({ queryKey: ["companies"] });

      queryClient.invalidateQueries({ queryKey: ["company", vars.companyId] });

      queryClient.invalidateQueries({ queryKey: ["moderation-pending-companies"] });

      queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });

      queryClient.invalidateQueries({ queryKey: ["moderation-journal"] });

      queryClient.invalidateQueries({ queryKey: ["report-timeline"] });

      queryClient.invalidateQueries({ queryKey: ["services"] });

    },

  });

}



export function useRestoreCompany() {

  const queryClient = useQueryClient();



  return useMutation({

    mutationFn: async ({

      companyId,

      moderatorProfileId,

      reason,

      reportId,

      notify,

    }: BasePayload & { companyId: string }) => {

      const comment = reason.trim() || "Восстановлена модератором";



      const { error: companyErr } = await supabase

        .from("companies")

        .update({

          verification_status: "draft",

          rejection_reason: null,

        })

        .eq("id", companyId);



      if (companyErr) throw companyErr;



      const { error: reviewErr } = await supabase.from("company_verification_reviews").insert({

        company_id: companyId,

        moderator_id: moderatorProfileId,

        decision: "restored",

        comment,

      });

      if (reviewErr) throw reviewErr;



      await logModerationAction({

        moderatorProfileId,

        actionType: "company_restore",

        targetType: "company",

        targetId: companyId,

        reportId,

        reason: comment,

      });



      if (reportId) {

        await appendReportEvent({

          reportId,

          actorProfileId: moderatorProfileId,

          eventType: "company_restore",

          summary: "Компания возвращена в черновик",

        });

      }



      await afterModerationNotify(

        notify,

        "Компания восстановлена",

        `«${notify?.targetLabel || "Компания"}» снова доступна для редактирования и повторной подачи на проверку.`,

        "Обновление по жалобе",

        `Статус объекта «${notify?.targetLabel || "компания"}» изменён модератором.`,

      );

    },

    onSuccess: (_, vars) => {

      queryClient.invalidateQueries({ queryKey: ["companies"] });

      queryClient.invalidateQueries({ queryKey: ["company", vars.companyId] });

      queryClient.invalidateQueries({ queryKey: ["moderation-pending-companies"] });

      queryClient.invalidateQueries({ queryKey: ["moderation-journal"] });

    },

  });

}



export function useRevokeCompanyVerified() {

  const queryClient = useQueryClient();



  return useMutation({

    mutationFn: async ({

      companyId,

      moderatorProfileId,

      reason,

      reportId,

      closeReportAsReviewed = false,

      notify,

    }: BasePayload & { companyId: string }) => {

      const comment = reason.trim();

      if (!comment) throw new Error("Укажите причину");



      const { error: companyErr } = await supabase

        .from("companies")

        .update({

          verification_status: "revoked",

          rejection_reason: comment,

        })

        .eq("id", companyId);



      if (companyErr) throw companyErr;



      const { error: reviewErr } = await supabase.from("company_verification_reviews").insert({

        company_id: companyId,

        moderator_id: moderatorProfileId,

        decision: "revoked",

        comment,

      });

      if (reviewErr) throw reviewErr;



      await logModerationAction({

        moderatorProfileId,

        actionType: "company_revoke_verified",

        targetType: "company",

        targetId: companyId,

        reportId,

        reason: comment,

      });



      if (reportId) {

        await appendReportEvent({

          reportId,

          actorProfileId: moderatorProfileId,

          eventType: "company_revoke_verified",

          summary: "Снят статус «Проверено»",

        });

        await closeReportIfNeeded(reportId, closeReportAsReviewed, moderatorProfileId);

      }



      await afterModerationNotify(

        notify,

        "Снят статус «Проверено»",

        `С компании «${notify?.targetLabel || "Компания"}» снят бейдж проверки. Компания остаётся в каталоге. Причина: ${comment}`,

        "Жалоба обработана",

        `По жалобе на «${notify?.targetLabel || "компанию"}»: снят статус «Проверено».`,

      );

    },

    onSuccess: (_, vars) => {

      queryClient.invalidateQueries({ queryKey: ["companies"] });

      queryClient.invalidateQueries({ queryKey: ["company", vars.companyId] });

      queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });

      queryClient.invalidateQueries({ queryKey: ["moderation-journal"] });

      queryClient.invalidateQueries({ queryKey: ["report-timeline"] });

      queryClient.invalidateQueries({ queryKey: ["services"] });

    },

  });

}



export function useCloseTenderAsModerator() {

  const queryClient = useQueryClient();



  return useMutation({

    mutationFn: async ({

      tenderId,

      moderatorProfileId,

      reason,

      reportId,

      closeReportAsReviewed = true,

      notify,

    }: BasePayload & { tenderId: string }) => {

      const comment = reason.trim();

      if (!comment) throw new Error("Укажите причину");



      const { error: tenderErr } = await supabase

        .from("tenders")

        .update({ status: "closed", updated_at: new Date().toISOString() })

        .eq("id", tenderId);



      if (tenderErr) throw tenderErr;



      await logModerationAction({

        moderatorProfileId,

        actionType: "tender_close",

        targetType: "tender",

        targetId: tenderId,

        reportId,

        reason: comment,

      });



      if (reportId) {

        await appendReportEvent({

          reportId,

          actorProfileId: moderatorProfileId,

          eventType: "tender_close",

          summary: "Тендер закрыт",

        });

      }



      await closeReportIfNeeded(reportId, closeReportAsReviewed, moderatorProfileId);



      await afterModerationNotify(

        notify,

        "Тендер закрыт модератором",

        `Тендер «${notify?.targetLabel || "Тендер"}» закрыт. Причина: ${comment}`,

        "Жалоба обработана",

        `По вашей жалобе тендер «${notify?.targetLabel || ""}» закрыт.`,

      );

    },

    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: ["tenders"] });

      queryClient.invalidateQueries({ queryKey: ["my-tenders"] });

      queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });

      queryClient.invalidateQueries({ queryKey: ["moderation-journal"] });

      queryClient.invalidateQueries({ queryKey: ["report-timeline"] });

    },

  });

}



export type BanDurationDays = 1 | 7 | 30;



export function useBanProfileTemporary() {

  const queryClient = useQueryClient();



  return useMutation({

    mutationFn: async ({

      profileId,

      moderatorProfileId,

      reason,

      days,

      reportId,

      notify,

    }: BasePayload & { profileId: string; days: BanDurationDays }) => {

      const comment = reason.trim();

      if (!comment) throw new Error("Укажите причину");



      const until = new Date();

      until.setDate(until.getDate() + days);



      const { error: banErr } = await supabase.rpc("moderator_set_profile_ban", {

        p_profile_id: profileId,

        p_until: until.toISOString(),

        p_reason: comment,

      });

      if (banErr) throw banErr;



      await logModerationAction({

        moderatorProfileId,

        actionType: "profile_ban",

        targetType: "profile",

        targetId: profileId,

        reportId,

        reason: `${days} дн.: ${comment}`,

      });



      if (reportId) {

        await appendReportEvent({

          reportId,

          actorProfileId: moderatorProfileId,

          eventType: "profile_ban",

          summary: `Временная блокировка на ${days} дн.`,

          meta: { profileId, days },

        });

      }



      await afterModerationNotify(

        notify,

        "Временная блокировка аккаунта",

        `Ваш аккаунт заблокирован на ${days} дн. Причина: ${comment}`,

        "Меры по жалобе",

        `Владелец объекта «${notify?.targetLabel || ""}» временно заблокирован (${days} дн.).`,

      );

    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-journal"] });
      queryClient.invalidateQueries({ queryKey: ["report-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["target-owner-profile"] });
    },
  });
}

/** Владелец объекта жалобы и заявитель */

export async function resolveReportParties(

  targetType: "company" | "tender",

  targetId: string,

  reporterId: string,

): Promise<{ ownerProfileId: string | null; reporterProfileId: string }> {

  let ownerProfileId: string | null = null;



  if (targetType === "company") {

    const { data } = await supabase.from("companies").select("owner_id").eq("id", targetId).maybeSingle();

    ownerProfileId = data?.owner_id ?? null;

  } else {

    const { data } = await supabase.from("tenders").select("client_id").eq("id", targetId).maybeSingle();

    ownerProfileId = data?.client_id ?? null;

  }



  return { ownerProfileId, reporterProfileId: reporterId };

}


