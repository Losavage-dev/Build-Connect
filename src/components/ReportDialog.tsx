import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
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

const USER_REPORT_REASON_KEYS = ["spam", "fraud", "misleading", "inappropriate", "other"] as const;
const MODERATOR_REPORT_REASON_KEYS = ["policy", "verification", "misleadingMod", "inappropriateMod", "otherMod"] as const;

export type ReportDialogVariant = "user" | "moderator";

type Props = {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  triggerClassName?: string;
  variant?: ReportDialogVariant;
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
  const { t } = useTranslation("common");
  const isModerator = variant === "moderator";
  const reasonKeys = isModerator ? MODERATOR_REPORT_REASON_KEYS : USER_REPORT_REASON_KEYS;
  const defaultReason = isModerator ? "policy" : "spam";

  const reasons = useMemo(
    () => reasonKeys.map((value) => ({ value, label: t(`reports.reasons.${value}`) })),
    [reasonKeys, t],
  );

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
      toast.success(isModerator ? t("reports.successModerator") : t("reports.successUser"));
      setOpen(false);
      setDetails("");
      setReason(defaultReason);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : t("reports.error");
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
          {isModerator ? t("reports.moderatorTrigger") : t("reports.userTrigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isModerator ? t("reports.titleModerator") : t("reports.titleUser")}</DialogTitle>
          <DialogDescription>
            {isModerator ? (
              <>
                {t("reports.descModerator")}{" "}
                <span className="font-medium text-foreground">{targetLabel}</span>
              </>
            ) : (
              <>
                {t("reports.descUser")}{" "}
                <span className="font-medium text-foreground">{targetLabel}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {isModerator ? (
            <p className="text-xs text-amber-800 dark:text-amber-200/90 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              {t("reports.moderatorHint")}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label>{isModerator ? t("reports.reasonModerator") : t("reports.reasonUser")}</Label>
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
              {isModerator ? t("reports.detailsModerator") : t("reports.detailsUser")}
            </Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={
                isModerator ? t("reports.detailsPlaceholderModerator") : t("reports.detailsPlaceholderUser")
              }
              rows={4}
              maxLength={2000}
              className="rounded-xl"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" className="rounded-xl" disabled={submit.isPending} onClick={() => void handleSubmit()}>
            {submit.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isModerator ? (
              t("reports.submitModerator")
            ) : (
              t("reports.submitUser")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
