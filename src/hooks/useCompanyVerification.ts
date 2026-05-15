import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CompanyDocumentType, CompanyVerificationStatus } from "@/lib/companyVerification";
import { hasRequiredDocuments } from "@/lib/companyVerification";

export interface CompanyDocumentRow {
  id: string;
  company_id: string;
  document_type: CompanyDocumentType;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string;
  created_at: string;
}

export interface PendingCompanyRow {
  id: string;
  name: string;
  city: string;
  category: string;
  verification_status: CompanyVerificationStatus;
  verification_submitted_at: string | null;
  owner_id: string;
  owner?: { first_name: string | null; last_name: string | null; phone: string | null };
}

export function useCompanyDocuments(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-documents", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("company_documents")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as CompanyDocumentRow[];
    },
    enabled: !!companyId,
  });
}

export function useAddCompanyDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      companyId: string;
      documentType: CompanyDocumentType;
      storagePath: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      uploadedBy: string;
    }) => {
      const { data, error } = await supabase
        .from("company_documents")
        .insert({
          company_id: payload.companyId,
          document_type: payload.documentType,
          storage_path: payload.storagePath,
          file_name: payload.fileName,
          mime_type: payload.mimeType,
          size_bytes: payload.sizeBytes,
          uploaded_by: payload.uploadedBy,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CompanyDocumentRow;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["company-documents", vars.companyId] });
    },
  });
}

export function useDeleteCompanyDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      companyId: string;
      storagePath: string;
    }) => {
      const { error } = await supabase.from("company_documents").delete().eq("id", payload.id);
      if (error) throw error;
      return payload;
    },
    onSuccess: (vars) => {
      queryClient.invalidateQueries({ queryKey: ["company-documents", vars.companyId] });
    },
  });
}

export function useSubmitCompanyVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyId: string) => {
      const { data: docs, error: docsErr } = await supabase
        .from("company_documents")
        .select("document_type")
        .eq("company_id", companyId);

      if (docsErr) throw docsErr;

      const types = (docs || []).map((d) => d.document_type as CompanyDocumentType);
      if (!hasRequiredDocuments(types)) {
        throw new Error("Загрузите выписку о регистрации и удостоверение представителя");
      }

      const { data, error } = await supabase
        .from("companies")
        .update({
          verification_status: "pending",
          rejection_reason: null,
        })
        .eq("id", companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company", data.id] });
      queryClient.invalidateQueries({ queryKey: ["moderation-pending-companies"] });
    },
  });
}

export function usePendingCompaniesForModeration() {
  return useQuery({
    queryKey: ["moderation-pending-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select(
          `
          id,
          name,
          city,
          category,
          verification_status,
          verification_submitted_at,
          owner_id,
          owner:profiles!companies_owner_id_fkey (first_name, last_name, phone)
        `,
        )
        .eq("verification_status", "pending")
        .order("verification_submitted_at", { ascending: true });

      if (error) throw error;
      return (data || []) as PendingCompanyRow[];
    },
  });
}

export function useModerateCompanyVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      companyId: string;
      decision: "approved" | "rejected";
      comment?: string;
      moderatorProfileId: string;
    }) => {
      const newStatus: CompanyVerificationStatus =
        payload.decision === "approved" ? "verified" : "rejected";

      const companyUpdate: Record<string, unknown> = {
        verification_status: newStatus,
      };
      if (payload.decision === "rejected") {
        companyUpdate.rejection_reason = payload.comment?.trim() || "Документы не прошли проверку";
      } else {
        companyUpdate.rejection_reason = null;
      }

      const { error: companyErr } = await supabase
        .from("companies")
        .update(companyUpdate)
        .eq("id", payload.companyId);

      if (companyErr) throw companyErr;

      const { error: reviewErr } = await supabase.from("company_verification_reviews").insert({
        company_id: payload.companyId,
        moderator_id: payload.moderatorProfileId,
        decision: payload.decision,
        comment: payload.comment?.trim() || null,
      });

      if (reviewErr) throw reviewErr;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["moderation-pending-companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company", vars.companyId] });
      queryClient.invalidateQueries({ queryKey: ["company-documents", vars.companyId] });
    },
  });
}
