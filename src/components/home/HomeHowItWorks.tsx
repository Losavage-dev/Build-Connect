import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    step: "01",
    icon: Search,
    title: "Найдите или опубликуйте",
    description:
      "Ищите компанию в каталоге, услугу или материал — либо создайте тендер как заказчик без обязательной компании.",
  },
  {
    step: "02",
    icon: MessageSquare,
    title: "Обсудите в чате",
    description:
      "Отклик, заявка или заказ открывают диалог: переписка, файлы и статус заявки — всё в личном кабинете.",
  },
  {
    step: "03",
    icon: Star,
    title: "Завершите и оцените",
    description:
      "Заказчик завершает сделку и оставляет отзыв о компании — рейтинг помогает следующим заказчикам.",
  },
];

export function HomeHowItWorks() {
  return (
    <section className="py-20 md:py-24 relative overflow-hidden">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="container px-4 relative">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
              Как это работает
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-balance">
              От поиска до отзыва — три шага
            </h2>
            <p className="text-muted-foreground text-lg">
              Прозрачный цикл для заказчиков и строительных компаний на одной платформе.
            </p>
          </div>
          <Button variant="outline" asChild className="rounded-xl gap-2 group shrink-0 self-start md:self-auto">
            <Link to="/help">
              Подробнее в справке
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative group rounded-2xl border-2 border-border/60 bg-card p-6 md:p-8 hover:border-primary/25 transition-colors duration-300"
              >
                {i < steps.length - 1 ? (
                  <div
                    className="hidden md:block absolute top-1/2 -right-4 lg:-right-5 w-8 lg:w-10 h-px bg-gradient-to-r from-border to-transparent z-10"
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
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
