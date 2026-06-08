import { Link } from "react-router-dom";
import { Building2, UserPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  isLoggedIn: boolean;
};

export function HomeCta({ isLoggedIn }: Props) {
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

          <div className="relative grid md:grid-cols-2 gap-8 md:gap-12 p-10 md:p-14 lg:p-16 text-primary-foreground">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-widest opacity-80">
                Для компаний
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-balance leading-tight">
                Получайте заявки, отклики и новых клиентов
              </h2>
              <p className="text-lg opacity-90 leading-relaxed max-w-md">
                Создайте карточку, пройдите верификацию и появитесь в каталоге — заказчики найдут вас через
                поиск, тендеры и витрину.
              </p>
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="rounded-xl text-base font-semibold px-8 h-12 bg-background text-foreground hover:bg-background/90 gap-2"
              >
                <Link to={isLoggedIn ? "/create-company" : "/auth"}>
                  <Building2 className="h-5 w-5" />
                  Разместить компанию
                </Link>
              </Button>
            </div>

            <div className="flex flex-col justify-center gap-4">
              <div className="rounded-2xl bg-background/10 backdrop-blur border border-white/20 p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-background/20 p-2.5 shrink-0">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Заказчик без компании</p>
                    <p className="text-sm opacity-85 leading-relaxed">
                      Публикуйте тендеры, заказывайте услуги и материалы — откликаются проверенные компании.
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="w-full rounded-xl border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 gap-2"
                >
                  <Link to={isLoggedIn ? "/tenders" : "/auth"}>
                    Смотреть тендеры
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
