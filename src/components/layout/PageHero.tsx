import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  align?: "left" | "center";
  compact?: boolean;
  className?: string;
};

/** Шапка внутренних страниц — в стиле главной (blueprint + gradient). */
export function PageHero({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  description,
  actions,
  align = "left",
  compact = false,
  className,
}: PageHeroProps) {
  const centered = align === "center";

  return (
    <section className={cn("relative overflow-hidden border-b", className)}>
      <div className="absolute inset-0 blueprint-grid opacity-50" aria-hidden />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/6 blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-secondary/6 blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div
        className={cn(
          "container relative px-4",
          compact ? "py-8 md:py-10" : "py-10 md:py-14",
          centered && "text-center max-w-3xl mx-auto",
        )}
      >
        <div
          className={cn(
            "flex gap-6",
            centered ? "flex-col items-center" : "flex-col md:flex-row md:items-end md:justify-between",
          )}
        >
          <div className={cn("space-y-3", centered && "space-y-4")}>
            {eyebrow ? (
              <div
                className={cn(
                  "inline-flex items-center gap-2 text-sm font-medium",
                  centered
                    ? "rounded-full bg-card/80 backdrop-blur border border-border/60 px-4 py-1.5 shadow-sm text-foreground"
                    : "font-semibold uppercase tracking-widest text-primary",
                )}
              >
                {EyebrowIcon ? <EyebrowIcon className="h-4 w-4 text-primary shrink-0" /> : null}
                {eyebrow}
              </div>
            ) : null}
            <h1
              className={cn(
                "font-black tracking-tight text-balance",
                compact ? "text-3xl md:text-4xl" : "text-3xl md:text-4xl lg:text-5xl",
              )}
            >
              {title}
            </h1>
            {description ? (
              <p
                className={cn(
                  "text-muted-foreground leading-relaxed",
                  centered ? "text-base md:text-lg max-w-xl mx-auto" : "text-base md:text-lg max-w-2xl",
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className={cn("shrink-0 flex flex-wrap gap-2", centered && "justify-center")}>{actions}</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function SectionHeader({ eyebrow, title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8", className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{eyebrow}</p>
        ) : null}
        <h2 className="text-2xl md:text-3xl font-bold mb-1">{title}</h2>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Обёртка основного контента страницы маркетплейса. */
export function PageContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("py-8 md:py-10 bg-muted/15 border-b", className)}>
      <div className="container px-4">{children}</div>
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-14 px-6 rounded-2xl border-2 border-dashed border-border/60 bg-card/50">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <p className="text-lg font-medium mb-2">{title}</p>
      {description ? <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{description}</p> : null}
      {action}
    </div>
  );
}
