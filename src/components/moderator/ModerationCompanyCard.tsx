import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Check, ExternalLink, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useCompanyDocuments,
  useModerateCompanyVerification,
} from "@/hooks/useCompanyVerification";
import { usePrivateFileUpload } from "@/hooks/usePrivateFileUpload";
import { COMPANY_DOCUMENT_LABELS } from "@/lib/companyVerification";
import { toast } from "sonner";

type Props = {
  companyId: string;
  companyName: string;
  city: string;
  category: string;
  submittedAt: string | null;
  ownerName: string;
  ownerPhone: string | null;
  moderatorProfileId: string;
};

export function ModerationCompanyCard({
  companyId,
  companyName,
  city,
  category,
  submittedAt,
  ownerName,
  ownerPhone,
  moderatorProfileId,
}: Props) {
  const [comment, setComment] = useState("");
  const [expanded, setExpanded] = useState(false);
  const { data: documents = [], isLoading } = useCompanyDocuments(expanded ? companyId : undefined);
  const moderate = useModerateCompanyVerification();
  const { getSignedUrl } = usePrivateFileUpload();

  const handleDecision = async (decision: "approved" | "rejected") => {
    if (decision === "rejected" && !comment.trim()) {
      toast.error("Укажите причину отклонения");
      return;
    }
    try {
      await moderate.mutateAsync({
        companyId,
        decision,
        comment: comment.trim() || undefined,
        moderatorProfileId,
      });
      toast.success(decision === "approved" ? "Компания одобрена" : "Заявка отклонена");
      setComment("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка";
      toast.error(msg);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          {companyName}
        </CardTitle>
        <CardDescription>
          {category} · {city}
          {submittedAt
            ? ` · подана ${new Date(submittedAt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}`
            : ""}
        </CardDescription>
        <p className="text-sm text-muted-foreground">
          Владелец: {ownerName}
          {ownerPhone ? ` · ${ownerPhone}` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/company/${companyId}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Карточка
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Скрыть документы" : "Показать документы"}
          </Button>
        </div>

        {expanded ? (
          isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Документы не найдены.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-2 border rounded-md px-3 py-2">
                  <span>
                    {doc.file_name} — {COMPANY_DOCUMENT_LABELS[doc.document_type]}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const url = await getSignedUrl(doc.storage_path);
                      if (url) window.open(url, "_blank", "noopener,noreferrer");
                      else toast.error("Не удалось открыть файл");
                    }}
                  >
                    Открыть
                  </Button>
                </li>
              ))}
            </ul>
          )
        ) : null}

        <div className="space-y-2">
          <Label htmlFor={`comment-${companyId}`}>Комментарий (обязателен при отклонении)</Label>
          <Textarea
            id={`comment-${companyId}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Замечания модератора для владельца компании"
            rows={2}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button className="gap-1" disabled={moderate.isPending} onClick={() => handleDecision("approved")}>
            <Check className="h-4 w-4" />
            Одобрить
          </Button>
          <Button
            variant="destructive"
            className="gap-1"
            disabled={moderate.isPending}
            onClick={() => handleDecision("rejected")}
          >
            <X className="h-4 w-4" />
            Отклонить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
