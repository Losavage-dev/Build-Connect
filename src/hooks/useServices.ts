import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Service {
  id: string;
  company_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  material_group?: string | null;
  created_at: string;
  updated_at: string;
  // joined
  company_name?: string;
  company_city?: string;
}

export function useServices(category?: string, excludeCategory?: string) {
  return useQuery({
    queryKey: ["services", category, excludeCategory],
    queryFn: async () => {
      let query = supabase
        .from("services")
        .select("*, companies!inner(name, city, verification_status)")
        .eq("companies.verification_status", "verified")
        .order("created_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }
      
      if (excludeCategory) {
        query = query.neq("category", excludeCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((s: any) => ({
        ...s,
        company_name: s.companies?.name,
        company_city: s.companies?.city,
      })) as Service[];
    },
  });
}

export function useMyCompanies(profileId: string | undefined) {
  return useQuery({
    queryKey: ["my-companies", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, logo_url, category")
        .eq("owner_id", profileId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: {
      company_id: string;
      title: string;
      description: string;
      price: number;
      category: string;
      material_group?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("services")
        .insert(service)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}
