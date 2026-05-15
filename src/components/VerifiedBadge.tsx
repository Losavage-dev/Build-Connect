import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md";
};

export function VerifiedBadge({ className, size = "sm" }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        className,
      )}
      title="Компания проверена модераторами"
    >
      <BadgeCheck className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      Проверено
    </span>
  );
}
