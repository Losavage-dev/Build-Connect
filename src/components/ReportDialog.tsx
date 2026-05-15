import { useState, useEffect } from "react";
import { Flag, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSubmitReport, type ReportTargetType } from "@/hooks/useReports";
import { firstZodError, reportSchema } from "@/lib/validation";
import { toast } from "sonner";

const USER_REPORT_REASONS = [
  { value: "spam", label: "Спам или реклама" },
  { value: "fraud", label: "Мошенничество / обман" },
  { value: "misleading", label: "Недостоверная информация" },
  { value: "inappropriate", label: "Неприемлемый контент" },
  { value: "other", label: "Другое" },
] as const;

const MODERATOR_REPORT_REASONS = [
  { value: "policy", label: "Нарушение правил платформы" },
  { value: "verification", label: "Противоречие данным / верификации" },
  { value: "misleading", label: "Вводящая в заблуждение информация" },
  { value: "inappropriate", label: "Неприемлемый контент" },
  { value: "other", label: "Иное (служебная фиксация)" },
] as const;

export type ReportDialogVariant = "user" | "moderator";

type Props = {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  triggerClassName?: string;
  variant?: ReportDialogVariant;
  /** Кнопка-триггер: для модератора — outline по умолчанию */
  triggerVariant?: "outline" | "ghost" | "link";
};

export function ReportDialog({
  targetType,
  targetId,
  targetLabel,
  triggerClassName,
  variant = "user",
  triggerVariant,
}: Props) {
  const isModerator = variant === "moderator";
  const reasons = isModerator ? MODERATOR_REPORT_REASONS : USER_REPORT_REASONS;
  const defaultReason = isModerator ? "policy" : "spam";

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(defaultReason);
  const [details, setDetails] = useState("");
  const submit = useSubmitReport();

  const effectiveTriggerVariant =
    triggerVariant ?? (isModerator ? "outline" : "ghost");

  useEffect(() => {
    setReason(isModerator ? "policy" : "spam");
  }, [isModerator]);

  const handleSubmit = async () => {
    const reasonLabel = reasons.find((r) => r.value === reason)?.label || reason;
    const parsed = reportSchema.safeParse({ reason: reasonLabel, details });
    const err = firstZodError(parsed);
    if (err) {
      toast.error(err);
      return;
    }
    try {
      await submit.mutateAsync({
        target_type: targetType,
        target_id: targetId,
        reason: reasonLabel,
        details: details.trim() || undefined,
        initiated_by_staff: isModerator,
      });
      toast.success(
        isModerator
          ? "Служебная жалоба зарегистрирована в очереди."
          : "Жалоба отправлена. Модераторы рассмотрят её вручную.",
      );
      setOpen(false);
      setDetails("");
      setReason(defaultReason);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Не удалось отправить жалобу";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={effectiveTriggerVariant}
          size="sm"
          className={triggerClassName}
        >
          {isModerator ? (
            <Shield className="h-3.5 w-3.5 mr-1.5" />
          ) : (
            <Flag className="h-3.5 w-3.5 mr-1.5" />
          )}
          {isModerator ? "Служебная жалоба" : "Пожаловаться"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isModerator ? "Служебная жалоба" : "Жалоба"}</DialogTitle>
          <DialogDescription>
            {isModerator ? (
              <>
                Фиксация нарушения от имени модерации:{" "}
                <span className="font-medium text-foreground">{targetLabel}</span>
              </>
            ) : (
              <>
                Сообщите о проблеме:{" "}
                <span className="font-medium text-foreground">{targetLabel}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {isModerator ? (
            <p className="text-xs text-amber-800 dark:text-amber-200/90 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              Запись попадёт в очередь с пометкой «от модератора», отличается от жалобы обычного пользователя.
            </p>
          ) : null}
          <div className="space-y-2">
            <Label>{isModerator ? "Категория (служебная)" : "Причина"}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-details">
              {isModerator ? "Обоснование" : "Подробности (необязательно)"}
            </Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={
                isModerator
                  ? "Факты, что проверить, ссылки…"
                  : "Опишите ситуацию..."
              }
              rows={4}
              maxLength={2000}
              className="rounded-xl"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button type="button" className="rounded-xl" disabled={submit.isPending} onClick={() => void handleSubmit()}>
            {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isModerator ? "Зафиксировать" : "Отправить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
