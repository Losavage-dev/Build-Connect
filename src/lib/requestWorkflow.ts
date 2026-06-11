import type { Request } from "@/hooks/useRequests";
import type { RequestCompletionFields } from "@/lib/requestCompletion";

export const ACTIVE_DEAL_STATUSES: Request["status"][] = ["pending", "accepted"];

export function isActiveDealStatus(status: Request["status"]): boolean {
  return status === "pending" || status === "accepted";
}

/** Допустимые переходы статуса заявки. */
export function canTransitionRequestStatus(
  from: Request["status"],
  to: Request["status"],
): boolean {
  if (from === to) return false;
  if (from === "completed" || from === "rejected") return false;
  if (from === "pending" && (to === "accepted" || to === "rejected")) return true;
  if (from === "accepted" && to === "completed") return true;
  return false;
}

export function transitionErrorMessage(from: Request["status"], to: Request["status"]): string {
  if (from === "pending" && to === "completed") {
    return "Сначала примите заявку в работу, затем завершите сделку после выполнения.";
  }
  if (from === "completed") return "Заявка уже завершена.";
  if (from === "rejected") return "Заявка отклонена — статус изменить нельзя.";
  return "Этот переход статуса недоступен.";
}

export function canProfileAcceptRequest(
  request: RequestCompletionFields & { status: Request["status"] },
  profileId: string | undefined,
  myCompanyIds: string[] = [],
): boolean {
  if (!profileId || request.status !== "pending") return false;

  if (request.source_tender_id && request.recipient_profile_id) {
    return request.recipient_profile_id === profileId;
  }

  if (request.company_id && myCompanyIds.includes(request.company_id) && request.client_id !== profileId) {
    return true;
  }

  if (request.recipient_profile_id && !request.source_tender_id) {
    return request.recipient_profile_id === profileId;
  }

  return false;
}

export function canProfileRejectRequest(
  request: RequestCompletionFields & { status: Request["status"] },
  profileId: string | undefined,
  myCompanyIds: string[] = [],
): boolean {
  return canProfileAcceptRequest(request, profileId, myCompanyIds);
}

/** Удалить можно только завершённую заявку (история чата сохраняется до удаления). */
export function canDeleteRequest(status: Request["status"]): boolean {
  return status === "completed";
}

export const REQUEST_DELETE_BLOCKED_MESSAGE =
  "Удалить можно только завершённую заявку. Сначала завершите сделку в чате.";
