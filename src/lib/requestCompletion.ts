/** Кто может завершить заявку и кто оставляет отзыв о компании. */

export type RequestCompletionFields = {
  client_id: string;
  company_id: string | null;
  recipient_profile_id: string | null;
  source_tender_id?: string | null;
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
  return getRequestCustomerProfileId(request) === profileId;
}

export function canProfileReviewCompany(
  request: RequestCompletionFields,
  profileId: string | undefined,
): boolean {
  if (!profileId || !request.company_id) return false;
  return getRequestCustomerProfileId(request) === profileId;
}
