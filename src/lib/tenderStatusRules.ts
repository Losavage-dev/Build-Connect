import type { TenderStatus } from "@/hooks/useTenders";

export const TENDER_NEED_BID_FOR_IN_PROGRESS =
  "Чтобы перевести тендер в «В работе», нужен хотя бы один отклик. Дождитесь отклика или нажмите «Принять» в списке откликов.";

export const TENDER_CANNOT_REOPEN_WITH_ACCEPTED =
  "Нельзя снова открыть тендер: уже выбран исполнитель. Оставьте «В работе» или закройте тендер.";

type BidLike = { status: string };

/** Исполнитель выбран, работа ещё идёт */
export function tenderHasAcceptedBid(responses: BidLike[] | undefined): boolean {
  return (responses ?? []).some((r) => r.status === "accepted");
}

/** Отклик завершён — тендер должен быть закрыт */
export function tenderHasCompletedBid(responses: BidLike[] | undefined): boolean {
  return (responses ?? []).some((r) => r.status === "completed");
}

/** Принят или завершён — нельзя снова «Открыт» */
export function tenderHasChosenExecutor(responses: BidLike[] | undefined): boolean {
  return tenderHasAcceptedBid(responses) || tenderHasCompletedBid(responses);
}

export function canChangeTenderStatus(
  fromStatus: string,
  toStatus: TenderStatus,
  hasResponses: boolean,
  hasChosenExecutor: boolean,
): { ok: true } | { ok: false; message: string } {
  if (toStatus === "open" && hasChosenExecutor) {
    return { ok: false, message: TENDER_CANNOT_REOPEN_WITH_ACCEPTED };
  }
  if (toStatus === "in_progress" && fromStatus === "open" && !hasResponses) {
    return { ok: false, message: TENDER_NEED_BID_FOR_IN_PROGRESS };
  }
  return { ok: true };
}
