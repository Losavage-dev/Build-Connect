import type { ReportTargetType } from "@/hooks/useReports";

export const REPORT_ESCALATION_THRESHOLD = 3;

export function reportTargetTypeLabel(type: ReportTargetType): string {
  return type === "company" ? "Компания" : "Тендер";
}

export function reportOpenTargetLabel(type: ReportTargetType): string {
  if (type === "company") return "Открыть страницу компании";
  return "Открыть этот тендер";
}

export function reportTargetHref(type: ReportTargetType, targetId: string): string {
  if (type === "company") return `/company/${targetId}`;
  return `/tenders?listing=${encodeURIComponent(targetId)}`;
}

export const MODERATION_ACTION_LABELS: Record<string, string> = {
  company_suspend: "Компания скрыта из каталога",
  company_restore: "Компания возвращена в черновик",
  company_revoke_verified: "Снят статус «Проверено»",
  tender_close: "Тендер закрыт",
  profile_ban: "Временная блокировка аккаунта",
  profile_unban: "Блокировка снята",
  owner_warning: "Предупреждение владельцу",
  report_status_change: "Изменён статус жалобы",
};

/** Подпись объекта для текста предупреждения */
export function ownerWarningObjectLabel(type: ReportTargetType): string {
  return type === "company" ? "вашей компании" : "вашего тендера";
}

export const REPORT_STATUS_LABELS: Record<string, string> = {
  new: "Новая жалоба",
  reviewed: "Меры приняты",
  dismissed: "Жалоба необоснована",
};
