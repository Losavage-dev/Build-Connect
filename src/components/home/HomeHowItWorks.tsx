import { useTranslation } from "react-i18next";
import { MessageSquare, Search, Star, Handshake } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Search,
    titleKey: "howItWorks.step1Title",
    descKey: "howItWorks.step1Desc",
  },
  {
    step: "02",
    icon: Handshake,
    titleKey: "howItWorks.step2Title",
    descKey: "howItWorks.step2Desc",
  },
  {
    step: "03",
    icon: MessageSquare,
    titleKey: "howItWorks.step3Title",
    descKey: "howItWorks.step3Desc",
  },
  {
    step: "04",
    icon: Star,
    titleKey: "howItWorks.step4Title",
    descKey: "howItWorks.step4Desc",
  },
];

export function HomeHowItWorks() {
  const { t } = useTranslation("home");

  return (
    <section className="py-20 md:py-24 relative overflow-hidden">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="container px-4 relative">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
              {t("howItWorks.eyebrow")}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-balance">
              {t("howItWorks.title")}
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative group rounded-2xl border-2 border-border/60 bg-card p-6 md:p-8 hover:border-primary/25 transition-colors duration-300"
              >
                {i < steps.length - 1 ? (
                  <div
                    className="hidden lg:block absolute top-1/2 -right-4 lg:-right-5 w-8 lg:w-10 h-px bg-gradient-to-r from-border to-transparent z-10"
                    aria-hidden
                  />
                ) : null}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-4xl font-black text-primary/15 font-[Space_Grotesk] leading-none">
                    {item.step}
                  </span>
                  <div className="rounded-2xl bg-primary/10 p-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{t(item.titleKey)}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  {t(item.descKey)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
