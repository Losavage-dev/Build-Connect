import { supabase } from "@/integrations/supabase/client";

const BUCKET = "request-attachments";
const MAX_BYTES = 20 * 1024 * 1024;

export async function uploadRequestChatFile(
  requestId: string,
  profileId: string,
  file: File,
): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("Размер файла не более 20 МБ");
  }
  const safe = file.name.replace(/[^\w.\-\u0400-\u04FF]/g, "_").slice(0, 180) || "file";
  const path = `${requestId}/${profileId}_${Date.now()}_${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}
