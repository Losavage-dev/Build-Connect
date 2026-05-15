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
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Уведомления
          {unread.length > 0 ? (
            <span className="text-sm font-normal text-destructive">({unread.length} новых)</span>
          ) : null}
        </CardTitle>
        <CardDescription>Решения по жалобам и действиям модерации</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.slice(0, 5).map((n) => (
          <div
            key={n.id}
            className={`rounded-lg border p-3 text-sm ${!n.read_at ? "bg-primary/5 border-primary/20" : "bg-muted/20"}`}
          >
            <p className="font-medium">{n.title}</p>
            {n.body ? <p className="text-muted-foreground mt-1">{n.body}</p> : null}
            <div className="flex flex-wrap items-center gap-2 mt-2">
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
