import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCapabilities } from "@/hooks/useCapabilities";

/** Подсказка на витринах: модератор только смотрит каталог, действия — в кабинете */
export function StaffBrowsingBanner() {
  const caps = useCapabilities();
  if (!caps.isStaff) return null;

  return (
    <Alert className="mb-6 border-primary/20 bg-primary/5">
      <Shield className="h-4 w-4" />
      <AlertDescription className="text-sm">
        Режим модератора: создание компаний, тендеров и откликов недоступно. Жалобы и верификация — в{" "}
        <Link to="/profile?tab=reports" className="font-medium text-primary underline-offset-2 hover:underline">
          кабинете модератора
        </Link>
        .
      </AlertDescription>
    </Alert>
  );
}
