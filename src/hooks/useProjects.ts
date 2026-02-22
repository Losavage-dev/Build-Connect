import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project: { company_id: string; title: string; description?: string; completion_date?: string }) => {
      const { data, error } = await supabase
        .from("projects")
        .insert(project)
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

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, company_id }: { id: string; company_id: string }) => {
      const { error } = await supabase
        .from("projects")
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

export function useAddProjectImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (image: { project_id: string; image_url: string; caption?: string; company_id: string }) => {
      const { company_id, ...imageData } = image;
      const { data, error } = await supabase
        .from("project_images")
        .insert(imageData)
        .select()
        .single();
      if (error) throw error;
      return { ...data, company_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["company", data.company_id] });
    },
  });
}
