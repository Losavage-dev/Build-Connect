import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: { company_id: string; name: string; description?: string; price_from?: number; price_to?: number }) => {
      const { data, error } = await supabase
        .from("company_services")
        .insert(service)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["company", variables.company_id] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, company_id }: { id: string; company_id: string }) => {
      const { error } = await supabase
        .from("company_services")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { id, company_id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["company", variables.company_id] });
    },
  });
}
