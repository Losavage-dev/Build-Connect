import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project: {
      company_id: string;
      title: string;
      description?: string;
      completion_date?: string;
      start_date?: string;
      project_phase?: string;
    }) => {
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

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      company_id,
      title,
      description,
      completion_date,
      start_date,
      project_phase,
    }: {
      id: string;
      company_id: string;
      title: string;
      description?: string | null;
      completion_date?: string | null;
      start_date?: string | null;
      project_phase?: string;
    }) => {
      const { error } = await supabase
        .from("projects")
        .update({
          title,
          description: description ?? null,
          completion_date: completion_date || null,
          start_date: start_date || null,
          project_phase: project_phase ?? "completed",
        })
        .eq("id", id);
      if (error) throw error;
      return { company_id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["company", variables.company_id] });
    },
  });
}

export function useDeleteProjectImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      imageId,
      imageUrl,
      company_id,
    }: {
      imageId: string;
      imageUrl: string;
      company_id: string;
    }) => {
      const { error } = await supabase.from("project_images").delete().eq("id", imageId);
      if (error) throw error;
      return { imageUrl, company_id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["company", variables.company_id] });
    },
  });
}

export function useAddProjectImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (image: {
      project_id: string;
      image_url: string;
      caption?: string;
      company_id: string;
      image_role?: string;
    }) => {
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
