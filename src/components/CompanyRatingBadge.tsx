import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatReviewCount, type CompanyReviewStats } from "@/lib/companyReviewStats";
import { cn } from "@/lib/utils";

type Props = {
  stats: CompanyReviewStats;
  size?: "sm" | "md";
  className?: string;
};

const CompanyRatingBadge = ({ stats, size = "sm", className }: Props) => {
  const { t } = useTranslation("common");

  if (!stats.hasReviews) {
    return (
      <span className={cn("text-muted-foreground", size === "md" ? "text-sm" : "text-xs", className)}>
        {t("noReviews")}
      </span>
    );
  }

  const starClass = size === "md" ? "h-6 w-6" : "h-3.5 w-3.5";
  const textClass = size === "md" ? "text-2xl" : "text-sm";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Star className={cn(starClass, "fill-yellow-400 text-yellow-400 shrink-0")} />
      <span className={cn("font-bold", textClass)}>{stats.averageRating?.toFixed(1)}</span>
      <span className={cn("text-muted-foreground", size === "md" ? "text-base" : "text-xs")}>
        ({formatReviewCount(stats.count, t)})
      </span>
    </div>
  );
};

export default CompanyRatingBadge;
