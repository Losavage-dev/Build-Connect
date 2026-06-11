import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type AppLanguage,
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  setAppLanguage,
} from "@/i18n";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  variant?: "icon" | "compact";
};

export function LanguageSwitcher({ className, variant = "icon" }: Props) {
  const { i18n, t } = useTranslation("nav");

  const current = (SUPPORTED_LANGUAGES.includes(i18n.language as AppLanguage)
    ? i18n.language
    : "ru") as AppLanguage;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={variant === "icon" ? "icon" : "sm"}
          className={cn(
            "rounded-xl shrink-0",
            variant === "compact" && "h-9 px-2.5 gap-1.5 font-semibold",
            className,
          )}
          aria-label={t("language.switch")}
        >
          <Globe className="h-4 w-4 shrink-0" />
          {variant === "compact" ? (
            <span className="uppercase text-xs tracking-wide">{current}</span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl min-w-[9rem]">
        {SUPPORTED_LANGUAGES.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => setAppLanguage(lng)}
            className={cn("cursor-pointer", current === lng && "font-semibold text-primary")}
          >
            {LANGUAGE_LABELS[lng]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
