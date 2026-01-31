import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const uploadImage = async (file: File, folder: string = "projects"): Promise<string | null> => {
    if (!user) {
      toast.error("Необходимо войти в аккаунт");
      return null;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${folder}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("project-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("project-images")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Ошибка загрузки изображения");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      // Extract path from URL
      const path = url.split("/project-images/")[1];
      if (!path) return false;

      const { error } = await supabase.storage
        .from("project-images")
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Ошибка удаления изображения");
      return false;
    }
  };

  return { uploadImage, deleteImage, isUploading };
}
