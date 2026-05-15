import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ReportTargetType = "company" | "tender";

export type SubmitReportInput = {
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details?: string;
};

export function useSubmitReport() {
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (input: SubmitReportInput) => {
      if (!profile) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("reports")
        .insert({
          reporter_id: profile.id,
          target_type: input.target_type,
          target_id: input.target_id,
          reason: input.reason.trim(),
          details: input.details?.trim() || null,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
  });
}
