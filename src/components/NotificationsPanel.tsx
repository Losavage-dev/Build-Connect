import { Link } from "react-router-dom";
import { Bell, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMarkNotificationRead, useMyNotifications } from "@/hooks/useNotifications";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export function NotificationsPanel() {
  const { profile } = useAuth();
  const { data: items = [], isLoading } = useMyNotifications(profile?.id);
  const markRead = useMarkNotificationRead();

  const unread = items.filter((n) => !n.read_at);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <Card className="mb-4 border-border/80 shadow-none">
      <CardHeader className="py-3 px-4 pb-2 space-y-1">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
          Уведомления
          {unread.length > 0 ? (
            <span className="text-xs font-normal text-destructive">({unread.length} новых)</span>
          ) : null}
        </CardTitle>
        <CardDescription className="text-xs">
          Новые заявки и сообщения, решения по жалобам и действия модераторов
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0 space-y-2">
        {items.slice(0, 5).map((n) => (
          <div
            key={n.id}
            className={`rounded-md border px-2.5 py-2 text-sm ${!n.read_at ? "bg-primary/5 border-primary/15" : "bg-muted/30"}`}
          >
            <p className="font-medium text-sm leading-snug">{n.title}</p>
            {n.body ? <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{n.body}</p> : null}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0 mt-1.5">
              <span className="text-xs text-muted-foreground">
                {format(new Date(n.created_at), "d MMM, HH:mm", { locale: ru })}
              </span>
              {n.link ? (
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <Link to={n.link}>Подробнее</Link>
                </Button>
              ) : null}
              {!n.read_at ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto py-0"
                  disabled={markRead.isPending}
                  onClick={() => void markRead.mutateAsync(n.id)}
                >
                  Прочитано
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
