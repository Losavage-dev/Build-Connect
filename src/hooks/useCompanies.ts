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
  verification_status?: "draft" | "pending" | "verified" | "rejected";
  verification_submitted_at?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  company_categories?: { category: string }[];
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
      let companyIdsFromCategory: string[] | null = null;
      if (filters?.category && filters.category !== "all") {
        const { data: ccRows, error: ccErr } = await supabase
          .from("company_categories")
          .select("company_id")
          .eq("category", filters.category);
        if (ccErr) throw ccErr;
        companyIdsFromCategory = [...new Set((ccRows || []).map((r) => r.company_id))];
        if (companyIdsFromCategory.length === 0) return [];
      }

      let query = supabase
        .from("companies")
        .select("*, company_categories(category)")
        .eq("verification_status", "verified")
        .order("rating", { ascending: false });

      if (companyIdsFromCategory) {
        query = query.in("id", companyIdsFromCategory);
      }

      if (filters?.city && filters.city !== "all") {
        query = query.eq("city", filters.city);
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
        .select(
          `
          *,
          projects (
            id,
            title,
            description,
            completion_date,
            start_date,
            project_phase,
            project_images (id, image_url, caption, image_role)
          ),
          company_services (id, name, description, price_from, price_to),
          company_categories (category),
          reviews (
            id,
            rating,
            comment,
            created_at,
            author:profiles (first_name, last_name)
          )
        `,
        )
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export type CreateCompanyPayload = Omit<
  Company,
  "id" | "rating" | "review_count" | "created_at" | "is_verified" | "company_categories"
> & { categories: string[] };

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCompanyPayload) => {
      const { categories, ...rest } = payload;
      const list = [...new Set(categories.map((c) => c.trim()).filter(Boolean))];
      if (list.length === 0) {
        throw new Error("Выберите хотя бы одну категорию");
      }

      const { data, error } = await supabase
        .from("companies")
        .insert({
          ...rest,
          category: list[0],
        })
        .select()
        .single();

      if (error) throw error;

      const { error: catErr } = await supabase.from("company_categories").insert(
        list.map((category) => ({ company_id: data.id, category })),
      );
      if (catErr) throw catErr;

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
      const { data, error } = await supabase.from("companies").update(updates).eq("id", id).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company", variables.id] });
    },
  });
}

export function useReplaceCompanyCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, categories }: { companyId: string; categories: string[] }) => {
      const list = [...new Set(categories.map((c) => c.trim()).filter(Boolean))];
      if (list.length === 0) {
        throw new Error("Нужна хотя бы одна категория");
      }

      const { error: delErr } = await supabase.from("company_categories").delete().eq("company_id", companyId);
      if (delErr) throw delErr;

      const { error: insErr } = await supabase
        .from("company_categories")
        .insert(list.map((category) => ({ company_id: companyId, category })));
      if (insErr) throw insErr;

      return { companyId, primary: list[0] };
    },
    onSuccess: ({ companyId }) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
    },
  });
}
