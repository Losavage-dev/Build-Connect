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
  label = "Статус тендера",
  showHint = true,
}: Props) {
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
      <Label className="text-xs text-muted-foreground block">{label}</Label>
      <Select value={status} onValueChange={handleChange} disabled={disabled || isLoading}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="open" disabled={blockOpen}>
            Открыт — принимает отклики{blockOpen ? " (исполнитель выбран)" : ""}
          </SelectItem>
          <SelectItem value="in_progress" disabled={blockInProgress}>
            В работе{blockInProgress ? " (нужен отклик)" : ""}
          </SelectItem>
          <SelectItem value="closed">Закрыт</SelectItem>
        </SelectContent>
      </Select>
      {showHint && blockInProgress ? (
        <p className="text-xs text-muted-foreground leading-relaxed">
          «В работе» станет доступно после первого отклика или по кнопке «Принять» у исполнителя.
        </p>
      ) : null}
      {statusMismatchOpen ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 space-y-2">
          <p className="text-xs text-foreground leading-relaxed">
            Исполнитель уже принят, но тендер всё ещё «Открыт». Переведите в «В работе», чтобы статусы совпадали.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 text-xs rounded-lg"
            disabled={disabled}
            onClick={() => onStatusChange("in_progress")}
          >
            Перевести в «В работе»
          </Button>
        </div>
      ) : null}
      {statusMismatchInProgress ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 space-y-2">
          <p className="text-xs text-foreground leading-relaxed">
            Отклик уже завершён, но тендер всё ещё «В работе». Закройте тендер — новые отклики не принимаются.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 text-xs rounded-lg"
            disabled={disabled}
            onClick={() => onStatusChange("closed")}
          >
            Закрыть тендер
          </Button>
        </div>
      ) : null}
    </div>
  );
}
