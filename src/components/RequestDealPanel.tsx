import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, ExternalLink, GitBranch, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Request } from "@/hooks/useRequests";
import type { RequestDisplayInfo } from "@/lib/requestDisplay";
import {
  buildDealStatusSteps,
  resolveDealContext,
  type DealStatusStep,
} from "@/lib/requestDealSummary";
import { useState, useMemo } from "react";
import { useAppFormat } from "@/hooks/useAppFormat";

type Props = {
  request: Request & {
    company?: { id?: string; name: string; logo_url?: string | null } | null;
    source_tender?: { id: string; title: string } | null;
  };
  display: RequestDisplayInfo;
  openingMessageContent?: string | null;
};

function StepDot({ step }: { step: DealStatusStep }) {
  return (
    <span
      className={cn(
        "h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-background",
        step.state === "done" && "bg-primary ring-primary/30",
        step.state === "current" && "bg-primary ring-primary animate-pulse",
        step.state === "upcoming" && "bg-muted-foreground/25 ring-transparent",
        step.state === "rejected" && "bg-destructive ring-destructive/30",
      )}
      aria-hidden
    />
  );
}

export function RequestDealPanel({ request, display, openingMessageContent }: Props) {
  const { t } = useTranslation("profile");
  const { formatDate } = useAppFormat();
  const [expanded, setExpanded] = useState(true);
  const context = resolveDealContext(request, openingMessageContent);
  const rawSteps = buildDealStatusSteps(request.status);

  const formatDealDateTime = (iso: string) =>
    formatDate(iso, {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusLabels = useMemo(
    () => ({
      pending: t("requests.status.pending"),
      accepted: t("requests.status.accepted"),
      rejected: t("requests.status.rejected"),
      completed: t("requests.status.completed"),
    }),
    [t],
  );

  const stepLabel = (id: string) => {
    if (id === "rejected") return t("dealPanel.steps.rejected");
    return t(`dealPanel.steps.${id as "created" | "pending" | "accepted" | "completed"}`);
  };

  const steps = rawSteps.map((step) => ({ ...step, label: stepLabel(step.id) }));

  const sourceLink = context.sourceUrl?.startsWith("/") ? context.sourceUrl : null;
  const sourceExternal = context.sourceUrl && !sourceLink ? context.sourceUrl : null;

  return (
    <div className="border-b border-border/60 bg-muted/15 shrink-0">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-muted/25 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="text-sm font-semibold flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary shrink-0" />
          {t("dealPanel.title")}
        </span>
        <span className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-lg font-normal text-xs">
            {statusLabels[request.status]}
          </Badge>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </span>
      </button>

      {expanded ? (
        <div className="px-4 pb-3 space-y-3 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card/60 px-3 py-2">
              <p className="text-xs text-muted-foreground mb-0.5">{t("dealPanel.source")}</p>
              <p className="font-medium break-words">{context.sourceLabel}</p>
              {sourceLink ? (
                <Link to={sourceLink} className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                  {t("dealPanel.open")} <ExternalLink className="h-3 w-3" />
                </Link>
              ) : sourceExternal ? (
                <a
                  href={sourceExternal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1 break-all"
                >
                  {t("dealPanel.openLink")} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : null}
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 px-3 py-2">
              <p className="text-xs text-muted-foreground mb-0.5">
                {display.direction === "incoming" ? t("dealPanel.incoming") : t("dealPanel.outgoing")}
              </p>
              <p className="font-medium break-words">{display.title}</p>
              {display.subtitle ? <p className="text-xs text-muted-foreground mt-0.5">{display.subtitle}</p> : null}
            </div>
          </div>

          {context.actingCompanyName ? (
            <p className="text-xs text-muted-foreground">
              {t("dealPanel.actingAs", { name: context.actingCompanyName })}
            </p>
          ) : null}

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {t("dealPanel.created", { date: formatDealDateTime(request.created_at) })}
            {request.updated_at !== request.created_at ? (
              <span>{t("dealPanel.updated", { date: formatDealDateTime(request.updated_at) })}</span>
            ) : null}
          </p>

          <div className="rounded-xl border border-border/60 bg-card/60 px-3 py-3">
            <p className="text-xs text-muted-foreground mb-2">{t("dealPanel.progress")}</p>
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
              {steps.map((step, index) => (
                <li key={step.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <StepDot step={step} />
                    <span
                      className={cn(
                        "text-xs whitespace-nowrap",
                        step.state === "current" && "font-semibold text-foreground",
                        step.state === "done" && "text-muted-foreground",
                        step.state === "upcoming" && "text-muted-foreground/60",
                        step.state === "rejected" && "font-semibold text-destructive",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 ? (
                    <span className="text-muted-foreground/40 hidden sm:inline" aria-hidden>
                      →
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  );
}
