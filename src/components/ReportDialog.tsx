import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
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

const REPORT_REASONS = [
  { value: "spam", label: "Спам или реклама" },
  { value: "fraud", label: "Мошенничество / обман" },
  { value: "misleading", label: "Недостоверная информация" },
  { value: "inappropriate", label: "Неприемлемый контент" },
  { value: "other", label: "Другое" },
] as const;

type Props = {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  triggerClassName?: string;
  variant?: "outline" | "ghost" | "link";
};

export function ReportDialog({
  targetType,
  targetId,
  targetLabel,
  triggerClassName,
  variant = "ghost",
}: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("spam");
  const [details, setDetails] = useState("");
  const submit = useSubmitReport();

  const handleSubmit = async () => {
    const reasonLabel = REPORT_REASONS.find((r) => r.value === reason)?.label || reason;
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
      });
      toast.success("Жалоба отправлена. Модераторы рассмотрят её вручную.");
      setOpen(false);
      setDetails("");
      setReason("spam");
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
        <Button type="button" variant={variant} size="sm" className={triggerClassName}>
          <Flag className="h-3.5 w-3.5 mr-1.5" />
          Пожаловаться
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Жалоба</DialogTitle>
          <DialogDescription>
            Сообщите о проблеме: <span className="font-medium text-foreground">{targetLabel}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label>Причина</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-details">Подробности (необязательно)</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Опишите ситуацию..."
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
            {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Отправить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
