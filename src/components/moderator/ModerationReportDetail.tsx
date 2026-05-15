import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModeratorTargetActions } from "@/components/moderator/ModeratorTargetActions";
import { useModerationReportDetail, useReportTimeline } from "@/hooks/useReportTimeline";
import {
  reportOpenTargetLabel,
  reportTargetTypeLabel,
  REPORT_ESCALATION_THRESHOLD,
} from "@/lib/moderationLabels";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export function ModerationReportDetail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const reportId = searchParams.get("reportId");

  const { data: report, isLoading } = useModerationReportDetail(reportId);
  const { data: timeline = [], isLoading: timelineLoading } = useReportTimeline(reportId);

  const goBack = () => {
    const fromArchive = report?.status !== "new";
    setSearchParams({ tab: fromArchive ? "reports-archive" : "reports" }, { replace: true });
  };

  if (!reportId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Не указан ID жалобы</CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Жалоба не найдена</CardContent>
      </Card>
    );
  }

  const reporterName = [report.reporter?.first_name, report.reporter?.last_name].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      <Button type="button" variant="ghost" size="sm" className="gap-1 -ml-2" onClick={goBack}>
        <ArrowLeft className="h-4 w-4" />
        {report.status === "new" ? "К новым жалобам" : "К архиву"}
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              {reportTargetTypeLabel(report.target_type)}: {report.targetLabel}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              {report.escalated ? (
                <Badge variant="destructive">{REPORT_ESCALATION_THRESHOLD}+ жалоб на объект</Badge>
              ) : null}
              {report.initiated_by_staff ? (
                <Badge variant="outline" className="border-primary/50 text-primary">
                  От модератора
                </Badge>
              ) : null}
              <Badge variant={report.status === "new" ? "destructive" : "secondary"}>
                {report.status === "new"
                  ? "Новая"
                  : report.status === "reviewed"
                    ? "Меры приняты"
                    : "Необоснована"}
              </Badge>
            </div>
          </div>
          <CardDescription>
            {format(new Date(report.created_at), "d MMM yyyy, HH:mm", { locale: ru })}
            {reporterName ? ` · от ${reporterName}` : ""}
            {report.reporter?.phone ? ` · ${report.reporter.phone}` : ""}
            {report.targetReportCount && report.targetReportCount > 1
              ? ` · всего жалоб на объект: ${report.targetReportCount}`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            <span className="font-medium">Причина:</span> {report.reason}
          </p>
          {report.details ? (
            <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">{report.details}</p>
          ) : null}
          {report.targetHref ? (
            <Button variant="outline" size="sm" asChild>
              <Link to={report.targetHref} target="_blank" rel="noreferrer">
                {reportOpenTargetLabel(report.target_type)}
              </Link>
            </Button>
          ) : null}

          <ModeratorTargetActions
            targetType={report.target_type}
            targetId={report.target_id}
            targetLabel={report.targetLabel || "Объект"}
            reportId={report.id}
            reportStatus={report.status}
            companyVerificationStatus={report.companyVerificationStatus}
            reporterId={report.reporter_id}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">История по жалобе</CardTitle>
          <CardDescription>События, действия модератора и решения по верификации</CardDescription>
        </CardHeader>
        <CardContent>
          {timelineLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
          ) : timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Пока только создание жалобы</p>
          ) : (
            <ol className="relative border-l border-muted pl-6 space-y-6">
              {timeline.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[1.6rem] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                  <p className="text-sm font-medium">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.at), "d MMM yyyy, HH:mm", { locale: ru })}
                    {entry.actorName ? ` · ${entry.actorName}` : ""}
                  </p>
                  {entry.detail ? (
                    <p className="text-sm text-muted-foreground mt-1 bg-muted/30 rounded-md p-2">{entry.detail}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
