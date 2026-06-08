import { supabase } from "@/integrations/supabase/client";
import { canProfileReviewCompany } from "@/lib/requestCompletion";

export type PendingCompanyReview = {
  companyId: string;
  companyName: string;
};

/** Нужен ли заказчику отзыв о компании после завершённой заявки. */
export async function fetchPendingCompanyReview(
  requestId: string,
  profileId: string,
): Promise<PendingCompanyReview | null> {
  const { data: request, error } = await supabase
    .from("requests")
    .select(`
      status,
      client_id,
      company_id,
      recipient_profile_id,
      source_tender_id,
      company:companies (name)
    `)
    .eq("id", requestId)
    .single();

  if (
    error ||
    !request ||
    request.status !== "completed" ||
    !request.company_id ||
    !canProfileReviewCompany(request, profileId)
  ) {
    return null;
  }

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("company_id", request.company_id)
    .eq("author_id", profileId)
    .maybeSingle();

  if (existing) return null;

  const companyName = request.company?.name?.trim() || "Компания";

  return {
    companyId: request.company_id,
    companyName,
  };
}
