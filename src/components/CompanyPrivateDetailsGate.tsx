import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { authPath } from "@/lib/authRedirect";
import { Button } from "@/components/ui/button";

type Props = {
  isAuthenticated: boolean;
  returnTo: string;
  children: React.ReactNode;
  compact?: boolean;
};

/** Показывает children только авторизованным; иначе — подсказка войти. */
export function CompanyPrivateDetailsGate({ isAuthenticated, returnTo, children, compact }: Props) {
  const { t } = useTranslation("common");

  if (isAuthenticated) return <>{children}</>;

  if (compact) {
    return <span className="text-muted-foreground text-sm">{t("privateDetails.afterLogin")}</span>;
  }

  return (
    <div className="rounded-xl border border-dashed bg-muted/30 p-4 space-y-3">
      <p className="text-sm text-muted-foreground flex items-start gap-2">
        <Lock className="h-4 w-4 shrink-0 mt-0.5" />
        {t("privateDetails.guestHint")}
      </p>
      <Button asChild variant="outline" size="sm" className="rounded-xl">
        <Link to={authPath(returnTo)}>{t("privateDetails.loginOrRegister")}</Link>
      </Button>
    </div>
  );
}
