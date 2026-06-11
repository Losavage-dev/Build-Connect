import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Request } from "@/hooks/useRequests";
import {
  buildCounterpartyOption,
  isActiveDealStatusForContract,
  type ContractCounterpartyOption,
} from "@/lib/contractCounterparties";

type RequestRow = Request & {
  description?: string | null;
  source_tender?: { city?: string | null } | null;
  company?: {
    id: string;
    name: string;
    bin?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    owner?: { first_name?: string | null; last_name?: string | null; phone?: string | null } | null;
  } | null;
  client?: { id: string; first_name?: string | null; last_name?: string | null; phone?: string | null; city?: string | null } | null;
  recipient?: { id: string; first_name?: string | null; last_name?: string | null; phone?: string | null; city?: string | null } | null;
};

export function useContractCounterparties(profileId: string | undefined) {
  return useQuery({
    queryKey: ["contract-counterparties", profileId],
    queryFn: async (): Promise<ContractCounterpartyOption[]> => {
      if (!profileId) return [];

      const { data: myCompanies, error: companiesErr } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", profileId);
      if (companiesErr) throw companiesErr;

      const myCompanyIds = (myCompanies || []).map((c) => c.id);
      const parts = [`client_id.eq.${profileId}`, `recipient_profile_id.eq.${profileId}`];
      if (myCompanyIds.length > 0) {
        parts.push(`company_id.in.(${myCompanyIds.join(",")})`);
      }

      const { data, error } = await supabase
        .from("requests")
        .select(
          `
          id,
          title,
          description,
          status,
          client_id,
          company_id,
          recipient_profile_id,
          source_tender_id,
          updated_at,
          source_tender:tenders (city),
          company:companies (
            id,
            name,
            bin,
            address,
            phone,
            email,
            city,
            owner:profiles!companies_owner_id_fkey (first_name, last_name, phone)
          ),
          client:profiles!requests_client_id_fkey (id, first_name, last_name, phone, city),
          recipient:profiles!requests_recipient_profile_id_fkey (id, first_name, last_name, phone, city)
        `,
        )
        .or(parts.join(","))
        .in("status", ["pending", "accepted"])
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const rows = (data || []) as RequestRow[];
      const companyById = new Map<string, NonNullable<RequestRow["company"]>>();
      const profileById = new Map<string, NonNullable<RequestRow["client"]>>();
      const profileIdsForCompanies = new Set<string>();

      for (const row of rows) {
        if (row.company?.id) companyById.set(row.company.id, row.company);
        if (row.client?.id) {
          profileById.set(row.client.id, row.client);
          profileIdsForCompanies.add(row.client.id);
        }
        if (row.recipient?.id) {
          profileById.set(row.recipient.id, row.recipient);
          profileIdsForCompanies.add(row.recipient.id);
        }
      }

      const ownerCompanyByProfileId = new Map<string, NonNullable<RequestRow["company"]>>();
      if (profileIdsForCompanies.size > 0) {
        const { data: ownerCompanies, error: ownerErr } = await supabase
          .from("companies")
          .select(
            "id, name, bin, address, phone, email, city, owner_id, owner:profiles!companies_owner_id_fkey (first_name, last_name, phone)",
          )
          .in("owner_id", [...profileIdsForCompanies])
          .order("created_at", { ascending: true });
        if (ownerErr) throw ownerErr;
        for (const company of ownerCompanies || []) {
          const ownerId = company.owner_id as string;
          if (!ownerCompanyByProfileId.has(ownerId)) {
            ownerCompanyByProfileId.set(ownerId, company as NonNullable<RequestRow["company"]>);
          }
          companyById.set(company.id, company as NonNullable<RequestRow["company"]>);
        }
      }

      const options: ContractCounterpartyOption[] = [];
      const seen = new Set<string>();
      for (const row of rows) {
        if (!isActiveDealStatusForContract(row.status)) continue;
        const option = buildCounterpartyOption(
          row,
          profileId,
          companyById,
          profileById,
          ownerCompanyByProfileId,
        );
        if (!option) continue;
        const key = `${option.ref.kind}:${option.ref.id}:${option.requestTitle.trim().toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        options.push(option);
      }

      return options;
    },
    enabled: !!profileId,
  });
}
