import { useState } from "react";
import { EyeOff, RotateCcw, Ban, Loader2, ShieldOff, Clock, AlertTriangle, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  useBanProfileTemporary,
  useCloseTenderAsModerator,
  useRestoreCompany,
  useRevokeCompanyVerified,
  useSuspendCompany,
  resolveReportParties,
  type BanDurationDays,
} from "@/hooks/useModeratorActions";
import { useUpdateReportStatus } from "@/hooks/useModerationReports";
import {
  useSendOwnerWarning,
  useTargetOwnerProfile,
  useUnbanProfile,
  isProfileBanned,
} from "@/hooks/useModeratorOwnerActions";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Props = {
  targetType: "company" | "tender";
  targetId: string;
  targetLabel: string;
  reportId?: string;
  reportStatus?: "new" | "reviewed" | "dismissed";
  companyVerificationStatus?: string | null;
  reporterId?: string;
  onActionComplete?: () => void;
};

type DialogKind =
  | "suspend"
  | "restore"
  | "revoke"
  | "close_tender"
  | "ban"
  | "warning"
  | "unban"
  | null;

export function ModeratorTargetActions({
  targetType,
  targetId,
  targetLabel,
  reportId,
  reportStatus = "new",
  companyVerificationStatus,
  reporterId,
  onActionComplete,
}: Props) {
  const { profile } = useAuth();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [reason, setReason] = useState("");
  const [banDays, setBanDays] = useState<BanDurationDays>(7);

  const suspend = useSuspendCompany();
  const restore = useRestoreCompany();
  const revoke = useRevokeCompanyVerified();
  const closeTender = useCloseTenderAsModerator();
  const banProfile = useBanProfileTemporary();
  const sendWarning = useSendOwnerWarning();
  const unbanProfile = useUnbanProfile();
  const updateReport = useUpdateReportStatus();
  const { data: ownerProfile } = useTargetOwnerProfile(targetType, targetId);
  const ownerBanned = isProfileBanned(ownerProfile);

  const busy =
    suspend.isPending ||
    restore.isPending ||
    revoke.isPending ||
    closeTender.isPending ||
    banProfile.isPending ||
    sendWarning.isPending ||
    unbanProfile.isPending ||
    updateReport.isPending;

  const buildNotify = async () => {
    if (!reporterId) return undefined;
    const parties = await resolveReportParties(targetType, targetId, reporterId);
    return {
      ownerProfileId: parties.ownerProfileId,
      reporterProfileId: parties.reporterProfileId,
      targetLabel,
      reportId,
    };
  };

  const runAction = async () => {
    if (!profile?.id) return;
    const comment = reason.trim();
    if (dialog !== "restore" && dialog !== "unban" && !comment) {
      toast.error(dialog === "warning" ? "Введите текст предупреждения" : "Укажите причину действия");
      return;
    }

    const notify = await buildNotify();

    try {
      if (dialog === "suspend") {
        await suspend.mutateAsync({
          companyId: targetId,
          moderatorProfileId: profile.id,
          reason: comment,
          reportId,
          closeReportAsReviewed: !!reportId,
          notify,
        });
        toast.success("Компания скрыта из каталога");
      } else if (dialog === "restore") {
        await restore.mutateAsync({
          companyId: targetId,
          moderatorProfileId: profile.id,
          reason: comment,
          reportId,
          notify,
        });
        toast.success("Компания возвращена в черновик");
      } else if (dialog === "revoke") {
        await revoke.mutateAsync({
          companyId: targetId,
          moderatorProfileId: profile.id,
          reason: comment,
          reportId,
          closeReportAsReviewed: !!reportId,
          notify,
        });
        toast.success("Снят статус «Проверено»");
      } else if (dialog === "close_tender") {
        await closeTender.mutateAsync({
          tenderId: targetId,
          moderatorProfileId: profile.id,
          reason: comment,
          reportId,
          closeReportAsReviewed: !!reportId,
          notify,
        });
        toast.success("Тендер закрыт");
      } else if (dialog === "ban") {
        const parties = await resolveReportParties(targetType, targetId, reporterId || "");
        if (!parties.ownerProfileId) {
          toast.error("Не найден владелец объекта");
          return;
        }
        await banProfile.mutateAsync({
          profileId: parties.ownerProfileId,
          moderatorProfileId: profile.id,
          reason: comment,
          days: banDays,
          reportId,
          notify,
        });
        toast.success(`Аккаунт заблокирован на ${banDays} дн.`);
      } else if (dialog === "warning") {
        await sendWarning.mutateAsync({
          targetType,
          targetId,
          targetLabel,
          moderatorProfileId: profile.id,
          message: comment,
          reportId,
        });
        toast.success("Предупреждение отправлено владельцу");
      } else if (dialog === "unban") {
        if (!ownerProfile?.id) {
          toast.error("Не найден владелец");
          return;
        }
        await unbanProfile.mutateAsync({
          profileId: ownerProfile.id,
          moderatorProfileId: profile.id,
          reason: comment,
          reportId,
          targetType,
          targetId,
          targetLabel,
        });
        toast.success("Блокировка снята");
      }
      setDialog(null);
      setReason("");
      onActionComplete?.();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Не удалось выполнить действие";
      toast.error(msg);
    }
  };

  const handleDismissReport = async () => {
    if (!reportId || !profile?.id) return;
    try {
      const parties = reporterId
        ? await resolveReportParties(targetType, targetId, reporterId)
        : null;
      await updateReport.mutateAsync({
        id: reportId,
        status: "dismissed",
        moderatorProfileId: profile.id,
        targetType,
        targetId,
        notify: parties
          ? {
              reporterId: parties.reporterProfileId,
              ownerId: parties.ownerProfileId,
              targetLabel,
            }
          : undefined,
      });
      toast.success("Жалоба закрыта как необоснованная");
      onActionComplete?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const handleReviewedOnly = async () => {
    if (!reportId || !profile?.id) return;
    try {
      const parties = reporterId
        ? await resolveReportParties(targetType, targetId, reporterId)
        : null;
      await updateReport.mutateAsync({
        id: reportId,
        status: "reviewed",
        moderatorProfileId: profile.id,
        targetType,
        targetId,
        notify: parties
          ? {
              reporterId: parties.reporterProfileId,
              ownerId: parties.ownerProfileId,
              targetLabel,
            }
          : undefined,
      });
      toast.success("Жалоба закрыта без санкций к объекту");
      onActionComplete?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    }
  };

  if (!profile) return null;

  const isNewReport = reportStatus === "new";
  const isSuspended = companyVerificationStatus === "suspended";
  const isVerified = companyVerificationStatus === "verified";

  const dialogTitle =
    dialog === "suspend"
      ? "Скрыть компанию"
      : dialog === "restore"
        ? "Вернуть компанию"
        : dialog === "revoke"
          ? "Снять «Проверено»"
          : dialog === "close_tender"
            ? "Закрыть тендер"
            : dialog === "ban"
              ? "Временная блокировка владельца"
              : dialog === "warning"
                ? "Предупреждение владельцу"
                : dialog === "unban"
                  ? "Снять блокировку"
                  : "";

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Действия модератора
      </p>
      {ownerBanned && ownerProfile?.banned_until ? (
        <p className="text-xs text-destructive">
          Владелец заблокирован до{" "}
          {format(new Date(ownerProfile.banned_until), "d MMM yyyy, HH:mm", { locale: ru })}
          {ownerProfile.ban_reason ? ` · ${ownerProfile.ban_reason}` : ""}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {targetType === "company" ? (
          <>
            {isVerified ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="gap-1"
                disabled={busy}
                onClick={() => {
                  setReason("");
                  setDialog("revoke");
                }}
              >
                <ShieldOff className="h-3.5 w-3.5" />
                Снять «Проверено»
              </Button>
            ) : null}
            {!isSuspended ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="gap-1"
                disabled={busy}
                onClick={() => {
                  setReason("");
                  setDialog("suspend");
                }}
              >
                <EyeOff className="h-3.5 w-3.5" />
                Скрыть компанию
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1"
                disabled={busy}
                onClick={() => {
                  setReason("");
                  setDialog("restore");
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Вернуть в черновик
              </Button>
            )}
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="gap-1"
            disabled={busy}
            onClick={() => {
              setReason("");
              setDialog("close_tender");
            }}
          >
            <Ban className="h-3.5 w-3.5" />
            Закрыть тендер
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1 border-amber-500/40 text-amber-800 dark:text-amber-200"
          disabled={busy}
          onClick={() => {
            setReason("");
            setDialog("warning");
          }}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Предупреждение владельцу
        </Button>

        {ownerBanned ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-1"
            disabled={busy}
            onClick={() => {
              setReason("");
              setDialog("unban");
            }}
          >
            <Unlock className="h-3.5 w-3.5" />
            Снять блокировку
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={busy}
            onClick={() => {
              setReason("");
              setDialog("ban");
            }}
          >
            <Clock className="h-3.5 w-3.5" />
            Бан владельца
          </Button>
        )}

        {isNewReport && reportId ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => void handleReviewedOnly()}
            >
              Закрыть без санкций
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void handleDismissReport()}
            >
              Жалоба необоснована
            </Button>
          </>
        ) : null}
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {targetLabel}.
              {dialog === "revoke"
                ? " Компания останется в каталоге, но без бейджа «Проверено»."
                : dialog === "ban"
                  ? " Владелец не сможет войти до окончания срока."
                  : dialog === "warning"
                    ? " Владелец получит уведомление в личном кабинете. Объект не скрывается."
                    : dialog === "unban"
                      ? " Владелец снова сможет войти в аккаунт."
                      : dialog === "close_tender"
                    ? " Тендер будет закрыт."
                    : dialog === "suspend"
                      ? " Компания исчезнет из каталога."
                      : ""}
              {reportId ? " Событие попадёт в историю жалобы." : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {dialog === "ban" ? (
              <div className="space-y-2">
                <Label>Срок блокировки</Label>
                <Select
                  value={String(banDays)}
                  onValueChange={(v) => setBanDays(Number(v) as BanDurationDays)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 день</SelectItem>
                    <SelectItem value="7">7 дней</SelectItem>
                    <SelectItem value="30">30 дней</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="mod-action-reason">
                {dialog === "warning"
                  ? "Текст предупреждения *"
                  : dialog === "unban"
                    ? "Комментарий (необязательно)"
                    : `Причина ${dialog === "restore" ? "(необязательно)" : "*"}`}
              </Label>
              <Textarea
                id="mod-action-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  dialog === "warning"
                    ? "Опишите, что нужно исправить или уточнить"
                    : "Для владельца, заявителя и журнала"
                }
                rows={3}
                maxLength={2000}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Отмена
            </Button>
            <Button type="button" disabled={busy} onClick={() => void runAction()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Подтвердить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
