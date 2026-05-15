import { Link } from "react-router-dom";
import InfoPageLayout from "@/components/InfoPageLayout";

const Terms = () => (
  <InfoPageLayout
    title="Условия использования"
    description="Правила работы с платформой BuildConnect"
  >
    <p className="text-sm">
      Дата публикации: 15 мая 2026 г. Используя сайт BuildConnect, вы соглашаетесь с настоящими
      условиями. Если вы не согласны с ними — пожалуйста, не пользуйтесь сервисом.
    </p>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">1. Общие положения</h2>
      <p>
        BuildConnect — информационная платформа для размещения профилей компаний, услуг, материалов,
        тендеров и обмена сообщениями между пользователями. Администрация предоставляет техническую
        возможность публикации и коммуникации, но не является стороной сделок между пользователями.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">2. Регистрация и аккаунт</h2>
      <p>
        Вы обязуетесь указывать достоверные данные при регистрации и поддерживать профиль в
        актуальном состоянии. Вы несёте ответственность за сохранность доступа к аккаунту и за все
        действия, совершённые под вашим логином.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">3. Контент пользователей</h2>
      <p>
        Размещая информацию о компании, услугах, материалах, тендерах, отзывах и сообщениях в чате,
        вы подтверждаете право публиковать такой контент и не нарушать законодательство Республики
        Казахстан, права третьих лиц и правила платформы. Запрещены: ложные сведения, спам,
        оскорбления, мошенничество, публикация чужих персональных данных без согласия.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">4. Сделки между пользователями</h2>
      <p>
        Условия оплаты, сроки, объём работ и ответственность сторон определяются напрямую между
        заказчиком и исполнителем. BuildConnect не гарантирует качество услуг, поставок или
        выполнение обязательств участников и не выступает посредником в расчётах, если иное явно не
        согласовано отдельно.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">5. Отзывы и рейтинг</h2>
      <p>
        Отзывы должны отражать реальный опыт взаимодействия. Администрация вправе скрыть или удалить
        отзывы и материалы, нарушающие правила или закон.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">6. Ограничение ответственности</h2>
      <p>
        Сервис предоставляется «как есть». Мы стремимся обеспечивать стабильную работу платформы, но
        не несём ответственности за перерывы в доступе, потерю данных по вине третьих лиц или
        убытки, возникшие из договорённостей между пользователями.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">7. Изменения условий</h2>
      <p>
        Мы можем обновлять настоящие условия. Актуальная версия всегда доступна на этой странице.
        Продолжение использования сервиса после публикации изменений означает согласие с обновлёнными
        условиями.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">8. Контакты</h2>
      <p>
        По вопросам, связанным с условиями использования и работой платформы, обращайтесь через{" "}
        <Link to="/contacts" className="text-primary font-medium hover:underline">
          Контакты
        </Link>{" "}
        или на{" "}
        <a href="mailto:support@buildconnect.kz" className="text-primary font-medium hover:underline">
          support@buildconnect.kz
        </a>
        .
      </p>
    </section>
  </InfoPageLayout>
);

export default Terms;
