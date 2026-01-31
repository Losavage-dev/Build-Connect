import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Company {
  id: string;
  name: string;
  description: string | null;
  category: string;
  city: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  rating: number;
  review_count: number;
  owner_id: string;
  is_verified: boolean;
  created_at: string;
}

export interface CompanyFilters {
  city?: string;
  category?: string;
  search?: string;
}

export function useCompanies(filters?: CompanyFilters) {
  return useQuery({
    queryKey: ["companies", filters],
    queryFn: async () => {
      let query = supabase
        .from("companies")
        .select("*")
        .order("rating", { ascending: false });

      if (filters?.city && filters.city !== "all") {
        query = query.eq("city", filters.city);
      }

      if (filters?.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Company[];
    },
  });
}

export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("companies")
        .select(`
          *,
          projects (
            id,
            title,
            description,
            completion_date,
            project_images (id, image_url, caption)
          ),
          company_services (id, name, description, price_from, price_to),
          reviews (
            id,
            rating,
            comment,
            created_at,
            author:profiles (first_name, last_name)
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (company: Omit<Company, "id" | "rating" | "review_count" | "created_at" | "is_verified">) => {
      const { data, error } = await supabase
        .from("companies")
        .insert(company)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Company> & { id: string }) => {
      const { data, error } = await supabase
        .from("companies")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company", variables.id] });
    },
  });
}
