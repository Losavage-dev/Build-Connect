import { Link } from "react-router-dom";
import { Loader2, ScrollText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModerationJournal } from "@/hooks/useModerationJournal";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export function ModerationJournalPanel() {
  const { data: rows = [], isLoading } = useModerationJournal(150);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="h-7 w-7" />
          Журнал модерации
        </h2>
        <p className="text-muted-foreground">
          Все действия модераторов по жалобам, компаниям, тендерам и аккаунтам
        </p>
      </div>

      {rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">Записей пока нет</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardHeader className="py-3 px-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-base">{row.actionLabel}</CardTitle>
                  <CardDescription>
                    {format(new Date(row.created_at), "d MMM yyyy, HH:mm", { locale: ru })}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Объект:</span> {row.targetLabel}{" "}
                  <Badge variant="outline" className="ml-1">
                    {row.target_type === "company"
                      ? "компания"
                      : row.target_type === "tender"
                        ? "тендер"
                        : row.target_type}
                  </Badge>
                </p>
                <p>
                  <span className="text-muted-foreground">Модератор:</span> {row.moderatorName}
                </p>
                {row.reason ? (
                  <p className="text-muted-foreground bg-muted/40 rounded-lg p-2">{row.reason}</p>
                ) : null}
                {row.reportHref ? (
                  <Button variant="link" size="sm" className="h-auto p-0" asChild>
                    <Link to={row.reportHref}>К жалобе</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
