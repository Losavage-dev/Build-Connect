import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useMarkNotificationRead, useMyNotifications } from "@/hooks/useNotifications";
import { useInboxCounts } from "@/hooks/useInboxCounts";
import { format } from "date-fns";
import { useDateFnsLocale } from "@/hooks/useAppFormat";

export function NotificationsDropdown() {
  const { t } = useTranslation("common");
  const dateLocale = useDateFnsLocale();
  const { profile } = useAuth();
  const { data: items = [], isLoading } = useMyNotifications(profile?.id);
  const { data: inbox } = useInboxCounts();
  const markRead = useMarkNotificationRead();

  const unreadCount = inbox?.notifications ?? items.filter((n) => !n.read_at).length;

  if (!profile) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 rounded-full shrink-0"
          aria-label={t("notifications.ariaLabel")}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center border-2 border-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 sm:w-96 rounded-xl p-0" align="end" forceMount>
        <DropdownMenuLabel className="px-4 py-3 font-semibold">
          {t("notifications.title")}
          {unreadCount > 0 ? (
            <span className="ml-2 text-xs font-normal text-destructive">
              {t("notifications.newCount", { count: unreadCount })}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-[min(420px,70vh)] overflow-y-auto px-2 py-2 space-y-1.5">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-2">{t("notifications.empty")}</p>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`rounded-lg border px-3 py-2.5 text-sm ${
                  !n.read_at ? "bg-primary/5 border-primary/20" : "bg-muted/20 border-transparent opacity-80"
                }`}
              >
                <p className="font-medium leading-snug">{n.title}</p>
                {n.body ? (
                  <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed line-clamp-2">{n.body}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(n.created_at), "d MMM, HH:mm", { locale: dateLocale })}
                  </span>
                  {n.link ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      asChild
                      onClick={() => {
                        if (!n.read_at) void markRead.mutateAsync(n.id);
                      }}
                    >
                      <Link to={n.link}>{t("notifications.open")}</Link>
                    </Button>
                  ) : null}
                  {!n.read_at ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto py-0 px-1 text-xs"
                      disabled={markRead.isPending}
                      onClick={() => void markRead.mutateAsync(n.id)}
                    >
                      {t("notifications.read")}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
