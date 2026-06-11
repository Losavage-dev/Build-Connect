import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { useDateFnsLocale } from "@/hooks/useAppFormat";

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
  const { t } = useTranslation("common");
  const dateLocale = useDateFnsLocale();
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
      toast.error(
        dialog === "warning"
          ? t("moderator.targetActions.errors.warningRequired")
          : t("moderator.targetActions.errors.reasonRequired"),
      );
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
        toast.success(t("moderator.targetActions.toast.companyHidden"));
      } else if (dialog === "restore") {
        await restore.mutateAsync({
          companyId: targetId,
          moderatorProfileId: profile.id,
          reason: comment,
          reportId,
          notify,
        });
        toast.success(t("moderator.targetActions.toast.companyRestored"));
      } else if (dialog === "revoke") {
        await revoke.mutateAsync({
          companyId: targetId,
          moderatorProfileId: profile.id,
          reason: comment,
          reportId,
          closeReportAsReviewed: !!reportId,
          notify,
        });
        toast.success(t("moderator.targetActions.toast.verifiedRevoked"));
      } else if (dialog === "close_tender") {
        await closeTender.mutateAsync({
          tenderId: targetId,
          moderatorProfileId: profile.id,
          reason: comment,
          reportId,
          closeReportAsReviewed: !!reportId,
          notify,
        });
        toast.success(t("moderator.targetActions.toast.tenderClosed"));
      } else if (dialog === "ban") {
        const parties = await resolveReportParties(targetType, targetId, reporterId || "");
        if (!parties.ownerProfileId) {
          toast.error(t("moderator.targetActions.errors.ownerNotFound"));
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
        toast.success(t("moderator.targetActions.toast.banSuccess", { days: banDays }));
      } else if (dialog === "warning") {
        await sendWarning.mutateAsync({
          targetType,
          targetId,
          targetLabel,
          moderatorProfileId: profile.id,
          message: comment,
          reportId,
        });
        toast.success(t("moderator.targetActions.toast.warningSent"));
      } else if (dialog === "unban") {
        if (!ownerProfile?.id) {
          toast.error(t("moderator.targetActions.errors.ownerMissing"));
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
        toast.success(t("moderator.targetActions.toast.unbanSuccess"));
      }
      setDialog(null);
      setReason("");
      onActionComplete?.();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : t("moderator.targetActions.errors.actionFailed");
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
      toast.success(t("moderator.targetActions.toast.dismissSuccess"));
      onActionComplete?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("moderator.targetActions.errors.generic"));
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
      toast.success(t("moderator.targetActions.toast.reviewedSuccess"));
      onActionComplete?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("moderator.targetActions.errors.generic"));
    }
  };

  if (!profile) return null;

  const isNewReport = reportStatus === "new";
  const isSuspended = companyVerificationStatus === "suspended";
  const isVerified = companyVerificationStatus === "verified";

  const dialogTitle = dialog
    ? t(`moderator.targetActions.dialogs.${dialog === "close_tender" ? "closeTender" : dialog}.title`)
    : "";

  const dialogDescKey =
    dialog === "close_tender"
      ? "closeTender"
      : dialog === "suspend" || dialog === "restore" || dialog === "revoke" || dialog === "ban" || dialog === "warning" || dialog === "unban"
        ? dialog
        : null;

  const reasonLabel =
    dialog === "warning"
      ? t("moderator.targetActions.labels.warningText")
      : dialog === "unban"
        ? t("moderator.targetActions.labels.commentOptional")
        : dialog === "restore"
          ? t("moderator.targetActions.labels.reasonOptional")
          : t("moderator.targetActions.labels.reasonRequired");

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {t("moderator.targetActions.sectionTitle")}
      </p>
      {ownerBanned && ownerProfile?.banned_until ? (
        <p className="text-xs text-destructive">
          {t("moderator.targetActions.ownerBannedUntil", {
            date: format(new Date(ownerProfile.banned_until), "d MMM yyyy, HH:mm", { locale: dateLocale }),
          })}
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
                {t("moderator.targetActions.buttons.revokeVerified")}
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
                {t("moderator.targetActions.buttons.hideCompany")}
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
                {t("moderator.targetActions.buttons.restoreDraft")}
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
            {t("moderator.targetActions.buttons.closeTender")}
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
          {t("moderator.targetActions.buttons.warning")}
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
            {t("moderator.targetActions.buttons.unban")}
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
            {t("moderator.targetActions.buttons.ban")}
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
              {t("moderator.targetActions.buttons.closeWithoutSanctions")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void handleDismissReport()}
            >
              {t("moderator.targetActions.buttons.dismiss")}
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
              {dialogDescKey ? t(`moderator.targetActions.dialogs.${dialogDescKey}.desc`) : ""}
              {reportId ? t("moderator.targetActions.historyNote") : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {dialog === "ban" ? (
              <div className="space-y-2">
                <Label>{t("moderator.targetActions.labels.banDuration")}</Label>
                <Select
                  value={String(banDays)}
                  onValueChange={(v) => setBanDays(Number(v) as BanDurationDays)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t("moderator.targetActions.labels.banDay1")}</SelectItem>
                    <SelectItem value="7">{t("moderator.targetActions.labels.banDay7")}</SelectItem>
                    <SelectItem value="30">{t("moderator.targetActions.labels.banDay30")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="mod-action-reason">{reasonLabel}</Label>
              <Textarea
                id="mod-action-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  dialog === "warning"
                    ? t("moderator.targetActions.placeholders.warning")
                    : t("moderator.targetActions.placeholders.reason")
                }
                rows={3}
                maxLength={2000}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              {t("cancel")}
            </Button>
            <Button type="button" disabled={busy} onClick={() => void runAction()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("moderator.targetActions.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
