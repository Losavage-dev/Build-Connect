import type { Request } from "@/hooks/useRequests";

export type RequestCompletionFields = {
  client_id: string;
  company_id: string | null;
  recipient_profile_id: string | null;
  source_tender_id?: string | null;
  status?: Request["status"];
};

/** Заказчик каталога / автор тендера для отклика. */
export function getRequestCustomerProfileId(request: RequestCompletionFields): string {
  if (request.source_tender_id && request.recipient_profile_id) {
    return request.recipient_profile_id;
  }
  return request.client_id;
}

export function canProfileCompleteRequest(
  request: RequestCompletionFields,
  profileId: string | undefined,
): boolean {
  if (!profileId) return false;
  if (request.status && request.status !== "accepted") return false;
  return getRequestCustomerProfileId(request) === profileId;
}

export function canProfileReviewCompany(
  request: RequestCompletionFields,
  profileId: string | undefined,
): boolean {
  if (!profileId || !request.company_id) return false;
  return getRequestCustomerProfileId(request) === profileId;
}
