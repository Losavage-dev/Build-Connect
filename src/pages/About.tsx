import { Link } from "react-router-dom";
import InfoPageLayout from "@/components/InfoPageLayout";

const About = () => (
  <InfoPageLayout
    title="О проекте"
    description="BuildConnect — маркетплейс строительной отрасли Казахстана"
  >
    <p>
      BuildConnect объединяет заказчиков, подрядчиков и поставщиков на одной платформе: компании
      размещают профили и портфолио, публикуют услуги и материалы, а заказчики находят исполнителей
      через каталог, тендеры и прямые заявки в чате.
    </p>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Для кого платформа</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong className="text-foreground">Заказчики</strong> — ищут подрядчиков, оставляют
          заявки, публикуют тендеры и ведут переписку в одном месте.
        </li>
        <li>
          <strong className="text-foreground">Подрядчики</strong> — представляют компанию, показывают
          проекты, откликаются на тендеры и получают заказы.
        </li>
        <li>
          <strong className="text-foreground">Поставщики</strong> — выставляют строительные материалы
          и общаются с покупателями через встроенный чат.
        </li>
      </ul>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Что есть на платформе</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <Link to="/catalog" className="text-primary font-medium hover:underline">
            Каталог компаний
          </Link>{" "}
          с фильтрами по городу и категории;
        </li>
        <li>
          разделы{" "}
          <Link to="/services" className="text-primary font-medium hover:underline">
            Услуги
          </Link>{" "}
          и{" "}
          <Link to="/materials" className="text-primary font-medium hover:underline">
            Материалы
          </Link>
          ;
        </li>
        <li>
          <Link to="/tenders" className="text-primary font-medium hover:underline">
            Тендеры
          </Link>{" "}
          с указанием города выполнения работ;
        </li>
        <li>
          <Link to="/feed" className="text-primary font-medium hover:underline">
            Витрина роликов
          </Link>{" "}
          — видео компаний с YouTube.
        </li>
      </ul>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Наша цель</h2>
      <p>
        Сделать поиск надёжных партнёров в строительстве прозрачным и удобным: меньше хаоса в
        переписке в мессенджерах, больше структуры — заявки, контекст сделки и история общения в
        личном кабинете.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Обратная связь</h2>
      <p>
        Платформа развивается. Если у вас есть идеи или вопросы — напишите на{" "}
        <Link to="/contacts" className="text-primary font-medium hover:underline">
          страницу контактов
        </Link>
        .
      </p>
    </section>
  </InfoPageLayout>
);

export default About;
