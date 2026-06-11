import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCapabilities } from "@/hooks/useCapabilities";

/** Подсказка на витринах: модератор только смотрит каталог */
export function StaffBrowsingBanner() {
  const { t } = useTranslation("common");
  const caps = useCapabilities();
  if (!caps.isStaff) return null;

  return (
    <Alert className="mb-6 border-primary/20 bg-primary/5">
      <AlertDescription className="text-sm">
        {t("staffBrowsing")}
      </AlertDescription>
    </Alert>
  );
}
