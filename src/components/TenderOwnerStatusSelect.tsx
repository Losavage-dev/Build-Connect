import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenderResponses } from "@/hooks/useTenderResponses";
import type { TenderStatus } from "@/hooks/useTenders";
import {
  canChangeTenderStatus,
  tenderHasAcceptedBid,
  tenderHasChosenExecutor,
  tenderHasCompletedBid,
} from "@/lib/tenderStatusRules";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  tenderId: string;
  tenderTitle: string;
  status: string;
  disabled?: boolean;
  onStatusChange: (status: TenderStatus) => void;
  label?: string;
  showHint?: boolean;
};

export function TenderOwnerStatusSelect({
  tenderId,
  tenderTitle,
  status,
  disabled,
  onStatusChange,
  label,
  showHint = true,
}: Props) {
  const { t } = useTranslation("marketplace");
  const resolvedLabel = label ?? t("tenderOwnerStatus.label");
  const { data: responses, isLoading } = useTenderResponses(tenderId, tenderTitle);
  const hasResponses = (responses?.length ?? 0) > 0;
  const hasAcceptedBid = tenderHasAcceptedBid(responses);
  const hasCompletedBid = tenderHasCompletedBid(responses);
  const hasChosenExecutor = tenderHasChosenExecutor(responses);
  const blockInProgress = status === "open" && !hasResponses && !isLoading;
  const blockOpen = hasChosenExecutor && !isLoading;
  const statusMismatchOpen = status === "open" && hasAcceptedBid && !isLoading;
  const statusMismatchInProgress = status === "in_progress" && hasCompletedBid && !isLoading;

  const handleChange = (value: string) => {
    const next = value as TenderStatus;
    const check = canChangeTenderStatus(status, next, hasResponses, hasChosenExecutor);
    if (!check.ok) {
      toast.error(check.message);
      return;
    }
    onStatusChange(next);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground block">{resolvedLabel}</Label>
      <Select value={status} onValueChange={handleChange} disabled={disabled || isLoading}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="open" disabled={blockOpen}>
            {t("tenderOwnerStatus.open")}
            {blockOpen ? t("tenderOwnerStatus.openBlocked") : ""}
          </SelectItem>
          <SelectItem value="in_progress" disabled={blockInProgress}>
            {t("tenderOwnerStatus.inProgress")}
            {blockInProgress ? t("tenderOwnerStatus.inProgressBlocked") : ""}
          </SelectItem>
          <SelectItem value="closed">{t("tenderOwnerStatus.closed")}</SelectItem>
        </SelectContent>
      </Select>
      {showHint && blockInProgress ? (
        <p className="text-xs text-muted-foreground leading-relaxed">{t("tenderOwnerStatus.hintBlocked")}</p>
      ) : null}
      {statusMismatchOpen ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 space-y-2">
          <p className="text-xs text-foreground leading-relaxed">{t("tenderOwnerStatus.mismatchOpenTitle")}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 text-xs rounded-lg"
            disabled={disabled}
            onClick={() => onStatusChange("in_progress")}
          >
            {t("tenderOwnerStatus.moveToInProgress")}
          </Button>
        </div>
      ) : null}
      {statusMismatchInProgress ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 space-y-2">
          <p className="text-xs text-foreground leading-relaxed">{t("tenderOwnerStatus.mismatchProgressTitle")}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 text-xs rounded-lg"
            disabled={disabled}
            onClick={() => onStatusChange("closed")}
          >
            {t("tenderOwnerStatus.closeTender")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
