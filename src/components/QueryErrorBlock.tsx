import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type Props = {
  title?: string;
  error: unknown;
  onRetry?: () => void;
};

function formatError(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const e = error as { message?: string; details?: string; hint?: string };
    if (e.message) {
      const extra = [e.details, e.hint].filter(Boolean).join(" — ");
      return extra ? `${e.message} (${extra})` : e.message;
    }
  }
  return fallback;
}

export default function QueryErrorBlock({
  title,
  error,
  onRetry,
}: Props) {
  const { t } = useTranslation("common");
  const resolvedTitle = title ?? t("loadErrorTitle");
  const message = formatError(error, t("unknownError"));
  const isJwt =
    /jwt|session|token|expired|invalid.*key|apikey/i.test(message) ||
    message.includes("401");

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3 max-w-lg mx-auto">
      <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
      <p className="font-semibold text-destructive">{resolvedTitle}</p>
      <p className="text-sm text-muted-foreground break-words">{message}</p>
      {isJwt ? (
        <p className="text-xs text-muted-foreground">
          {t("loadErrorJwtHint")}
        </p>
      ) : null}
      {onRetry ? (
        <Button type="button" variant="outline" className="rounded-xl" onClick={onRetry}>
          {t("retry")}
        </Button>
      ) : null}
    </div>
  );
}
