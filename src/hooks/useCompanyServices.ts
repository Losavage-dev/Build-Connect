import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      company_id: string;
      name: string;
      description?: string;
      price_from?: number;
      price_to?: number;
      vitrine_category: string;
    }) => {
      const { company_id, name, description, price_from, price_to, vitrine_category } = input;

      const priceNum =
        price_from != null && price_from !== undefined
          ? Number(price_from)
          : price_to != null && price_to !== undefined
            ? Number(price_to)
            : 0;

      const { data: listing, error: e1 } = await supabase
        .from("services")
        .insert({
          company_id,
          title: name.trim(),
          description: (description ?? "").trim() || "—",
          price: Number.isFinite(priceNum) ? priceNum : 0,
          category: vitrine_category,
        })
        .select("id")
        .single();

      if (e1) throw e1;
      if (!listing?.id) throw new Error("Не удалось создать витринную услугу");

      const { data, error: e2 } = await supabase
        .from("company_services")
        .insert({
          company_id,
          name: name.trim(),
          description: description?.trim() || null,
          price_from: price_from ?? null,
          price_to: price_to ?? null,
          vitrine_listing_id: listing.id,
        })
        .select()
        .single();

      if (e2) {
        await supabase.from("services").delete().eq("id", listing.id);
        throw e2;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["company", variables.company_id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, company_id }: { id: string; company_id: string }) => {
      const { data: row, error: qe } = await supabase
        .from("company_services")
        .select("vitrine_listing_id")
        .eq("id", id)
        .maybeSingle();

      if (qe) throw qe;

      if (row?.vitrine_listing_id) {
        const { error: de } = await supabase.from("services").delete().eq("id", row.vitrine_listing_id);
        if (de) throw de;
      }

      const { error } = await supabase.from("company_services").delete().eq("id", id);
      if (error) throw error;
      return { id, company_id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["company", variables.company_id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}
