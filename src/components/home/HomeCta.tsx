import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  isLoggedIn: boolean;
};

export function HomeCta({ isLoggedIn }: Props) {
  const { t } = useTranslation("home");

  return (
    <section className="py-20 md:py-24">
      <div className="container px-4">
        <div
          className="rounded-[2rem] overflow-hidden relative border border-border/40"
          style={{ background: "var(--gradient-cta)" }}
        >
          <div className="absolute inset-0 blueprint-grid opacity-20 mix-blend-overlay" aria-hidden />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_hsl(0_0%_100%_/_0.12),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_hsl(214_90%_52%_/_0.25),_transparent_45%)]" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8 p-10 md:p-14 lg:p-16 text-primary-foreground">
            <div className="space-y-5 max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold text-balance leading-tight">
                {t("cta.title")}
              </h2>
              <p className="text-lg opacity-90 leading-relaxed">
                {t("cta.subtitle")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="rounded-xl text-base font-semibold px-8 h-12 bg-background text-foreground hover:bg-background/90"
              >
                <Link to={isLoggedIn ? "/catalog" : "/auth"}>
                  {isLoggedIn ? t("cta.catalog") : t("cta.register")}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="rounded-xl border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 gap-2 h-12"
              >
                <Link to="/catalog">
                  {t("cta.catalog")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
