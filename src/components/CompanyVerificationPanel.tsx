import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  COMPANY_DOCUMENT_LABELS,
  type CompanyDocumentType,
  type CompanyVerificationStatus,
  VERIFICATION_STATUS_HINTS,
  VERIFICATION_STATUS_LABELS,
  canEditVerificationDocuments,
  hasRequiredDocuments,
} from "@/lib/companyVerification";
import {
  useAddCompanyDocument,
  useCompanyDocuments,
  useDeleteCompanyDocument,
  useSubmitCompanyVerification,
} from "@/hooks/useCompanyVerification";
import { usePrivateFileUpload } from "@/hooks/usePrivateFileUpload";
import { toast } from "sonner";

type Props = {
  companyId: string;
  status: CompanyVerificationStatus;
  rejectionReason?: string | null;
  profileId: string;
  readOnly?: boolean;
};

export function CompanyVerificationPanel({
  companyId,
  status,
  rejectionReason,
  profileId,
  readOnly = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<CompanyDocumentType>("registration");

  const { data: documents = [], isLoading } = useCompanyDocuments(companyId);
  const addDocument = useAddCompanyDocument();
  const deleteDocument = useDeleteCompanyDocument();
  const submitVerification = useSubmitCompanyVerification();
  const { uploadCompanyDocument, removeStorageFile, getSignedUrl, isUploading } =
    usePrivateFileUpload();

  const canEdit = !readOnly && canEditVerificationDocuments(status);
  const uploadedTypes = documents.map((d) => d.document_type);
  const readyToSubmit = hasRequiredDocuments(uploadedTypes);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canEdit) return;

    const storagePath = await uploadCompanyDocument(file, companyId);
    if (!storagePath) return;

    try {
      await addDocument.mutateAsync({
        companyId,
        documentType,
        storagePath,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedBy: profileId,
      });
      toast.success("Документ загружен");
    } catch (err: unknown) {
      await removeStorageFile(storagePath);
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Ошибка сохранения";
      toast.error(msg);
    }
  };

  const handleDelete = async (docId: string, storagePath: string) => {
    if (!canEdit) return;
    try {
      await deleteDocument.mutateAsync({ id: docId, companyId, storagePath });
      await removeStorageFile(storagePath);
      toast.success("Документ удалён");
    } catch {
      toast.error("Не удалось удалить документ");
    }
  };

  const handleOpen = async (storagePath: string) => {
    const url = await getSignedUrl(storagePath);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else toast.error("Не удалось открыть файл");
  };

  const handleSubmit = async () => {
    try {
      await submitVerification.mutateAsync(companyId);
      toast.success("Заявка отправлена на проверку");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка отправки";
      toast.error(msg);
    }
  };

  const statusIcon =
    status === "verified" ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
    ) : status === "pending" ? (
      <Clock className="h-5 w-5 text-amber-600" />
    ) : status === "rejected" ? (
      <AlertCircle className="h-5 w-5 text-destructive" />
    ) : (
      <ShieldCheck className="h-5 w-5 text-muted-foreground" />
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {statusIcon}
          Верификация компании
        </CardTitle>
        <CardDescription>
          Для публикации в каталоге нужны документы компании и одобрение модератора.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={status === "verified" ? "default" : "secondary"}>
            {VERIFICATION_STATUS_LABELS[status]}
          </Badge>
          <p className="text-sm text-muted-foreground">{VERIFICATION_STATUS_HINTS[status]}</p>
        </div>

        {status === "rejected" && rejectionReason ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Причина отклонения</AlertTitle>
            <AlertDescription>{rejectionReason}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            <Label>Загруженные документы</Label>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Документы ещё не загружены.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{doc.file_name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {COMPANY_DOCUMENT_LABELS[doc.document_type]}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleOpen(doc.storage_path)}>
                        Открыть
                      </Button>
                      {canEdit ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(doc.id, doc.storage_path)}
                          disabled={deleteDocument.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {canEdit ? (
          <div className="space-y-4 rounded-lg border border-dashed p-4">
            <div className="space-y-2">
              <Label>Тип документа</Label>
              <Select
                value={documentType}
                onValueChange={(v) => setDocumentType(v as CompanyDocumentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COMPANY_DOCUMENT_LABELS) as CompanyDocumentType[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {COMPANY_DOCUMENT_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,application/pdf,image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isUploading || addDocument.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading || addDocument.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Загрузить файл (PDF или фото, до 10 МБ)
            </Button>
            <p className="text-xs text-muted-foreground">
              Обязательно: выписка о регистрации и удостоверение представителя. Доверенность — если
              заявку подаёт не директор.
            </p>
            <Button
              type="button"
              className="w-full"
              disabled={!readyToSubmit || submitVerification.isPending}
              onClick={handleSubmit}
            >
              {submitVerification.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Отправить на проверку
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
