import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ReviewBlockReason =
  | "guest"
  | "own_company"
  | "already_reviewed"
  | "no_completed_request";

export function useReviewEligibility(companyId: string | undefined, companyOwnerId?: string) {
  const { profile, user } = useAuth();

  return useQuery({
    queryKey: ["review-eligibility", companyId, profile?.id],
    queryFn: async (): Promise<{
      canReview: boolean;
      reason: ReviewBlockReason | null;
      completedRequestId: string | null;
    }> => {
      if (!user || !profile || !companyId) {
        return { canReview: false, reason: "guest", completedRequestId: null };
      }
      if (companyOwnerId && companyOwnerId === profile.id) {
        return { canReview: false, reason: "own_company", completedRequestId: null };
      }

      const { data: existing, error: errReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("company_id", companyId)
        .eq("author_id", profile.id)
        .maybeSingle();
      if (errReview) throw errReview;
      if (existing) {
        return { canReview: false, reason: "already_reviewed", completedRequestId: null };
      }

      const { data: completed, error: errReq } = await supabase
        .from("requests")
        .select("id")
        .eq("company_id", companyId)
        .eq("client_id", profile.id)
        .eq("status", "completed")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (errReq) throw errReq;
      if (!completed) {
        return { canReview: false, reason: "no_completed_request", completedRequestId: null };
      }

      return { canReview: true, reason: null, completedRequestId: completed.id };
    },
    enabled: !!companyId && !!profile,
  });
}

export function reviewBlockMessage(reason: ReviewBlockReason | null | undefined): string {
  switch (reason) {
    case "guest":
      return "Войдите в аккаунт, чтобы оставить отзыв.";
    case "own_company":
      return "Нельзя оставить отзыв на свою компанию.";
    case "already_reviewed":
      return "Вы уже оставляли отзыв для этой компании.";
    case "no_completed_request":
      return "Отзыв доступен после завершения заявки с этой компанией — завершите диалог в чате.";
    default:
      return "";
  }
}
