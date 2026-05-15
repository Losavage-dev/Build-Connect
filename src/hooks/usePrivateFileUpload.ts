import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  COMPANY_DOCUMENTS_BUCKET,
  MAX_DOCUMENT_SIZE_BYTES,
  resolveDocumentMime,
} from "@/lib/companyVerification";

export function usePrivateFileUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadCompanyDocument = async (
    file: File,
    companyId: string,
  ): Promise<string | null> => {
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      toast.error("Файл слишком большой (макс. 10 МБ)");
      return null;
    }
    const mime = resolveDocumentMime(file);
    if (!mime) {
      toast.error("Допустимы PDF, JPEG, PNG, WebP или DOCX");
      return null;
    }

    setIsUploading(true);
    try {
      const safeName = file.name.replace(/[^\w.\-()+\s]/g, "_").slice(0, 120);
      const path = `${companyId}/${Date.now()}_${safeName}`;

      const { error } = await supabase.storage
        .from(COMPANY_DOCUMENTS_BUCKET)
        .upload(path, file, { upsert: false, contentType: mime });

      if (error) throw error;
      return path;
    } catch (error) {
      console.error("Private upload error:", error);
      toast.error("Не удалось загрузить файл");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const getSignedUrl = async (storagePath: string, expiresIn = 3600): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from(COMPANY_DOCUMENTS_BUCKET)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      console.error("Signed URL error:", error);
      return null;
    }
    return data.signedUrl;
  };

  const removeStorageFile = async (storagePath: string): Promise<boolean> => {
    const { error } = await supabase.storage.from(COMPANY_DOCUMENTS_BUCKET).remove([storagePath]);
    if (error) {
      console.error("Storage delete error:", error);
      return false;
    }
    return true;
  };

  return { uploadCompanyDocument, getSignedUrl, removeStorageFile, isUploading };
}
