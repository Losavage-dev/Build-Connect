import { cn } from "@/lib/utils";

const SIZE = {
  sm: "h-12 w-12 text-lg rounded-lg",
  md: "h-16 w-16 text-2xl rounded-xl sm:h-20 sm:w-20 sm:text-3xl",
  lg: "h-24 w-24 text-3xl rounded-2xl",
} as const;

function companyInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  const compact = name.replace(/[^A-Za-zА-Яа-яЁё0-9]/g, "");
  if (compact.length >= 2) return compact.slice(0, 2).toUpperCase();
  return (name.charAt(0) || "?").toUpperCase();
}

type CompanyLogoProps = {
  name: string;
  logoUrl?: string | null;
  size?: keyof typeof SIZE;
  className?: string;
};

/** Логотип компании или плейсхолдер в стиле карточек каталога. */
export function CompanyLogo({ name, logoUrl, size = "md", className }: CompanyLogoProps) {
  const initials = companyInitials(name);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden border border-border/60 bg-muted shadow-sm",
        SIZE[size],
        className,
      )}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/5 to-muted">
          <span className="select-none font-black text-primary/25">{initials}</span>
        </div>
      )}
    </div>
  );
}
