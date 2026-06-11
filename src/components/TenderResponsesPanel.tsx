import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { MessageSquare, UserCheck, Undo2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenderResponses } from "@/hooks/useTenderResponses";
import { useUpdateTender } from "@/hooks/useTenders";
import { useUpdateRequestStatus } from "@/hooks/useRequests";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { tenderHasAcceptedBid, tenderHasCompletedBid } from "@/lib/tenderStatusRules";
import { useDateFnsLocale } from "@/hooks/useAppFormat";

type Props = {
  tenderId: string;
  tenderTitle: string;
  tenderStatus: string;
  compact?: boolean;
};

export function TenderResponsesPanel({ tenderId, tenderTitle, tenderStatus, compact }: Props) {
  const { t } = useTranslation(["marketplace", "common", "profile"]);
  const dateLocale = useDateFnsLocale();
  const navigate = useNavigate();
  const { data: responses, isLoading } = useTenderResponses(tenderId, tenderTitle);
  const updateTender = useUpdateTender();
  const updateRequest = useUpdateRequestStatus();

  const requestStatusLabel: Record<string, string> = {
    pending: t("tenderResponses.statusPending"),
    accepted: t("tenderResponses.statusAccepted"),
    rejected: t("tenderResponses.statusRejected"),
    completed: t("tenderResponses.statusCompleted"),
  };

  const count = responses?.length ?? 0;
  const isClosed = tenderStatus === "closed";
  const hasAcceptedBid = tenderHasAcceptedBid(responses);
  const hasCompletedBid = tenderHasCompletedBid(responses);
  const busy = updateTender.isPending || updateRequest.isPending;

  const handleAccept = async (requestId: string) => {
    try {
      await updateTender.mutateAsync({ id: tenderId, status: "in_progress" });
      await updateRequest.mutateAsync({ id: requestId, status: "accepted" });
      toast.success(t("tenderResponses.acceptSuccess"));
    } catch {
      toast.error(t("tenderResponses.acceptError"));
    }
  };

  const handleCloseTender = async () => {
    try {
      await updateTender.mutateAsync({ id: tenderId, status: "closed" });
      toast.success(t("tenderResponses.closeSuccess"));
    } catch {
      toast.error(t("tenderResponses.closeError"));
    }
  };

  const handleReopenForBids = async () => {
    const accepted = (responses ?? []).filter((r) => r.status === "accepted");
    if (!accepted.length) return;
    try {
      for (const r of accepted) {
        await updateRequest.mutateAsync({ id: r.id, status: "pending" });
      }
      if (tenderStatus !== "open") {
        await updateTender.mutateAsync({ id: tenderId, status: "open" });
      }
      toast.success(t("tenderResponses.reopenSuccess"));
    } catch {
      toast.error(t("tenderResponses.reopenError"));
    }
  };

  return (
    <div className={cn("border-t pt-4 mt-4", compact && "pt-3 mt-3")}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="text-sm font-semibold text-foreground">
          {t("tenderResponses.title")} {isLoading ? "" : `(${count})`}
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {!isClosed && hasAcceptedBid && !hasCompletedBid ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-8 text-xs"
                  disabled={busy}
                >
                  <Undo2 className="h-3.5 w-3.5 mr-1" />
                  {t("tenderResponses.reopenBtn")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("tenderResponses.reopenTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("tenderResponses.reopenDesc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">{t("common:cancel")}</AlertDialogCancel>
                  <AlertDialogAction className="rounded-xl" onClick={() => void handleReopenForBids()}>
                    {t("tenderResponses.reopenConfirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
          {!isClosed && count > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg h-8 text-xs"
              disabled={busy}
              onClick={() => void handleCloseTender()}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              {t("tenderResponses.closeBtn")}
            </Button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ) : count === 0 ? (
        <p className="text-sm text-muted-foreground">
          {tenderStatus === "open" ? t("tenderResponses.emptyOpen") : t("tenderResponses.emptyClosed")}
        </p>
      ) : (
        <ul className="space-y-2">
          {responses!.map((r) => {
            const name = r.client
              ? `${r.client.first_name || ""} ${r.client.last_name || ""}`.trim() || t("common:participant")
              : t("common:participant");
            const initials = name.charAt(0) || "?";
            const canAccept = tenderStatus === "open" && r.status === "pending";

            return (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5"
              >
                <Avatar className="h-9 w-9 shrink-0 border">
                  <AvatarImage src={r.client?.avatar_url || ""} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(r.created_at), "d MMM yyyy, HH:mm", { locale: dateLocale })}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {requestStatusLabel[r.status] || r.status}
                </Badge>
                <div className="flex gap-1.5 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg h-8 flex-1 sm:flex-none"
                    onClick={() => navigate(`/chat/${r.id}`)}
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                    {t("common:chat")}
                  </Button>
                  {canAccept ? (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-lg h-8 flex-1 sm:flex-none"
                      disabled={updateTender.isPending || updateRequest.isPending}
                      onClick={() => void handleAccept(r.id)}
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1" />
                      {t("common:accept")}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {count > 0 ? (
        <p className="text-xs text-muted-foreground mt-3">
          <Link to="/profile" className="text-primary hover:underline">
            {t("tenderResponses.allRequests")}
          </Link>
          {t("tenderResponses.allRequestsHint")}
        </p>
      ) : null}
    </div>
  );
}
