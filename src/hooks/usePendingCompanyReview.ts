import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchPendingCompanyReview } from "@/lib/pendingCompanyReview";

/** Отзыв после сделки — на компанию исполнителя (B2B). */
export function usePendingCompanyReview(
  requestId: string | undefined,
  request: { status: string } | null | undefined,
) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["pending-company-review", requestId, profile?.id, request?.status],
    queryFn: async () => {
      if (!profile || !requestId || request?.status !== "completed") return null;
      return fetchPendingCompanyReview(requestId, profile.id);
    },
    enabled: !!profile && !!requestId && request?.status === "completed",
  });
}
