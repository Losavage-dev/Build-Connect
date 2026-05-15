import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TenderTypeValue } from "@/lib/constants";

export type TenderStatus = "open" | "in_progress" | "closed";

export interface TenderPosterCompany {
  id: string;
  name: string;
  logo_url: string | null;
}

export interface Tender {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget: number | null;
  deadline: string | null;
  status: TenderStatus | string;
  city: string | null;
  tender_type: TenderTypeValue | string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  /** Компания заказчика (владелец профиля client_id) */
  poster_company?: TenderPosterCompany | null;
}

export type TenderListFilters = {
  status?: string;
};

export function useTenders(filters?: TenderListFilters) {
  return useQuery({
    queryKey: ["tenders", filters?.status],
    queryFn: async () => {
      let query = supabase
        .from("tenders")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      const rows = (data || []) as Tender[];

      const clientIds = [...new Set(rows.map((t) => t.client_id))];
      if (clientIds.length === 0) return rows;

      const { data: companies } = await supabase
        .from("companies")
        .select("id, name, logo_url, owner_id, verification_status")
        .in("owner_id", clientIds);

      const byOwner = new Map<string, TenderPosterCompany>();
      for (const c of companies || []) {
        const existing = byOwner.get(c.owner_id);
        const entry: TenderPosterCompany = {
          id: c.id,
          name: c.name,
          logo_url: c.logo_url,
        };
        if (!existing || c.verification_status === "verified") {
          byOwner.set(c.owner_id, entry);
        }
      }

      return rows.map((t) => ({
        ...t,
        poster_company: byOwner.get(t.client_id) ?? null,
      }));
    },
  });
}

export function useMyTenders(profileId: string | undefined) {
  return useQuery({
    queryKey: ["my-tenders", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from("tenders")
        .select("*")
        .eq("client_id", profileId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tender[];
    },
    enabled: !!profileId,
  });
}

export function useCreateTender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tender: {
      client_id: string;
      title: string;
      description: string;
      city: string;
      tender_type: TenderTypeValue;
      budget?: number;
      deadline?: string;
    }) => {
      const { data, error } = await supabase
        .from("tenders")
        .insert({ ...tender, status: "open" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
      queryClient.invalidateQueries({ queryKey: ["my-tenders"] });
      queryClient.invalidateQueries({ queryKey: ["tender-responses"] });
    },
  });
}

export function useUpdateTender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: TenderStatus;
    }) => {
      const { data, error } = await supabase
        .from("tenders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
      queryClient.invalidateQueries({ queryKey: ["my-tenders"] });
      queryClient.invalidateQueries({ queryKey: ["tender-responses"] });
    },
  });
}
