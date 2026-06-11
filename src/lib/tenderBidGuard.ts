import { supabase } from "@/integrations/supabase/client";
import type { Request } from "@/hooks/useRequests";
import { ACTIVE_DEAL_STATUSES } from "@/lib/requestWorkflow";

export class DuplicateTenderBidError extends Error {
  readonly existingRequestId: string;

  constructor(existingRequestId: string) {
    super("DUPLICATE_TENDER_BID");
    this.name = "DuplicateTenderBidError";
    this.existingRequestId = existingRequestId;
  }
}

/** Активный отклик этого пользователя на тендер (pending / accepted). */
export async function findActiveTenderBid(
  tenderId: string,
  clientProfileId: string,
): Promise<Pick<Request, "id" | "status"> | null> {
  const { data, error } = await supabase
    .from("requests")
    .select("id, status")
    .eq("source_tender_id", tenderId)
    .eq("client_id", clientProfileId)
    .in("status", ACTIVE_DEAL_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function assertNoActiveTenderBid(tenderId: string, clientProfileId: string): Promise<void> {
  const existing = await findActiveTenderBid(tenderId, clientProfileId);
  if (existing) {
    throw new DuplicateTenderBidError(existing.id);
  }
}
