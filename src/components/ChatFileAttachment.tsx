import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BUCKET = "request-attachments";

type Props = {
  displayName: string;
  storagePath: string;
  isMe: boolean;
};

export function ChatFileAttachment({ displayName, storagePath, isMe }: Props) {
  const [loading, setLoading] = useState(false);

  const openDownload = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, 3600);
      if (error || !data?.signedUrl) {
        throw error ?? new Error("Нет ссылки");
      }
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Не удалось получить ссылку на файл";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const cardClass = isMe
    ? "rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-2.5"
    : "rounded-lg border border-border/80 bg-muted/50 px-3 py-2.5";

  return (
    <div className={`flex flex-col gap-2 min-w-0 max-w-full ${cardClass}`}>
      <div className="flex items-start gap-2 min-w-0">
        <FileText className={`h-4 w-4 shrink-0 mt-0.5 ${isMe ? "text-primary-foreground" : "text-primary"}`} />
        <div className="min-w-0">
          <p className={`text-sm font-medium break-words ${isMe ? "text-primary-foreground" : ""}`}>
            Файл: {displayName}
          </p>
          <p className={`text-xs break-all ${isMe ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
            Доступен только участникам этой заявки
          </p>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant={isMe ? "secondary" : "outline"}
        className="w-full sm:w-auto rounded-lg"
        disabled={loading}
        onClick={() => void openDownload()}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
        Скачать
      </Button>
    </div>
  );
}
