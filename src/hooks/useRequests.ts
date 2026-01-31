import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Request {
  id: string;
  company_id: string;
  client_id: string;
  title: string;
  description: string | null;
  status: "pending" | "accepted" | "rejected" | "completed";
  created_at: string;
  updated_at: string;
  company?: {
    name: string;
    logo_url: string | null;
  };
}

export function useRequests() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["requests", profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          company:companies (name, logo_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Request[];
    },
    enabled: !!profile,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (request: { company_id: string; title: string; description?: string }) => {
      if (!profile) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("requests")
        .insert({
          ...request,
          client_id: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Request["status"] }) => {
      const { data, error } = await supabase
        .from("requests")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}
