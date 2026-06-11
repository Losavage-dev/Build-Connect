import { Link } from "react-router-dom";
import { ChevronDown, ExternalLink, GitBranch, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Request } from "@/hooks/useRequests";
import type { RequestDisplayInfo } from "@/lib/requestDisplay";
import {
  buildDealStatusSteps,
  formatDealDateTime,
  REQUEST_STATUS_LABELS,
  resolveDealContext,
  type DealStatusStep,
} from "@/lib/requestDealSummary";
import { useState } from "react";

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
  const [expanded, setExpanded] = useState(true);
  const context = resolveDealContext(request, openingMessageContent);
  const steps = buildDealStatusSteps(request.status);

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
          О сделке
        </span>
        <span className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-lg font-normal text-xs">
            {REQUEST_STATUS_LABELS[request.status]}
          </Badge>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </span>
      </button>

      {expanded ? (
        <div className="px-4 pb-3 space-y-3 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card/60 px-3 py-2">
              <p className="text-xs text-muted-foreground mb-0.5">Источник</p>
              <p className="font-medium break-words">{context.sourceLabel}</p>
              {sourceLink ? (
                <Link to={sourceLink} className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                  Открыть <ExternalLink className="h-3 w-3" />
                </Link>
              ) : sourceExternal ? (
                <a
                  href={sourceExternal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1 break-all"
                >
                  Открыть ссылку <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : null}
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 px-3 py-2">
              <p className="text-xs text-muted-foreground mb-0.5">
                {display.direction === "incoming" ? "Входящая заявка" : "Исходящая заявка"}
              </p>
              <p className="font-medium break-words">{display.title}</p>
              {display.subtitle ? <p className="text-xs text-muted-foreground mt-0.5">{display.subtitle}</p> : null}
            </div>
          </div>

          {context.actingCompanyName ? (
            <p className="text-xs text-muted-foreground">
              От имени компании «<span className="text-foreground font-medium">{context.actingCompanyName}</span>»
            </p>
          ) : null}

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Создана: {formatDealDateTime(request.created_at)}
            {request.updated_at !== request.created_at ? (
              <span> · обновлена {formatDealDateTime(request.updated_at)}</span>
            ) : null}
          </p>

          <div className="rounded-xl border border-border/60 bg-card/60 px-3 py-3">
            <p className="text-xs text-muted-foreground mb-2">Ход сделки</p>
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
