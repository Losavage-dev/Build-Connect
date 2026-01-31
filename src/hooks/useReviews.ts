import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (review: { company_id: string; rating: number; comment?: string }) => {
      if (!profile) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          ...review,
          author_id: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["company", variables.company_id] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}
