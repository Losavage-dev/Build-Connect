import { Mail, MapPin, Clock } from "lucide-react";
import InfoPageLayout from "@/components/InfoPageLayout";

const Contacts = () => (
  <InfoPageLayout
    title="Контакты"
    description="Свяжитесь с командой BuildConnect"
  >
    <p>
      Мы отвечаем на обращения по работе платформы, сотрудничеству и техническим вопросам. Среднее
      время ответа — в течение 1–2 рабочих дней.
    </p>

    <div className="grid gap-4 sm:grid-cols-1">
      <div className="flex gap-4 rounded-xl border bg-card p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Электронная почта</p>
          <a href="mailto:support@buildconnect.kz" className="text-primary hover:underline">
            support@buildconnect.kz
          </a>
          <p className="text-sm mt-1">Для поддержки пользователей и партнёров</p>
        </div>
      </div>

      <div className="flex gap-4 rounded-xl border bg-card p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Регион работы платформы</p>
          <p>Казахстан</p>
          <p className="text-sm mt-1">Каталог компаний и услуг ориентирован на рынок РК</p>
        </div>
      </div>

      <div className="flex gap-4 rounded-xl border bg-card p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Часы поддержки</p>
          <p>Пн–Пт, 10:00–18:00 (время Алматы)</p>
          <p className="text-sm mt-1">В выходные ответ может занять больше времени</p>
        </div>
      </div>
    </div>

    <section className="space-y-3 pt-2">
      <h2 className="text-xl font-semibold text-foreground">О чём писать</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>технические сбои или ошибки на сайте;</li>
        <li>вопросы по заявкам, чату и профилю компании;</li>
        <li>предложения по развитию платформы;</li>
        <li>запросы от СМИ и партнёров.</li>
      </ul>
    </section>
  </InfoPageLayout>
);

export default Contacts;
