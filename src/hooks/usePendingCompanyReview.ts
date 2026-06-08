import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { canProfileReviewCompany } from "@/lib/requestCompletion";

/** Отзыв после сделки — на компанию исполнителя (B2B). */
export function usePendingCompanyReview(
  requestId: string | undefined,
  request: {
    status: string;
    client_id: string;
    company_id: string | null;
    recipient_profile_id: string | null;
    source_tender_id?: string | null;
    company?: { name: string } | null;
  } | null | undefined,
) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["pending-company-review", requestId, profile?.id],
    queryFn: async () => {
      if (
        !profile ||
        !requestId ||
        !request ||
        request.status !== "completed" ||
        !request.company_id ||
        !request.company?.name ||
        !canProfileReviewCompany(request, profile.id)
      ) {
        return null;
      }

      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("company_id", request.company_id)
        .eq("author_id", profile.id)
        .maybeSingle();

      if (existing) return null;

      return {
        companyId: request.company_id,
        companyName: request.company.name,
      };
    },
    enabled: !!profile && !!requestId && !!request && request.status === "completed",
  });
}
