import { Link } from "react-router-dom";
import InfoPageLayout from "@/components/InfoPageLayout";

const Help = () => (
  <InfoPageLayout
    title="Помощь"
    description="Ответы на частые вопросы о работе с BuildConnect"
  >
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Как начать работу</h2>
      <p>
        Зарегистрируйтесь, заполните профиль (имя, телефон, город), выберите{" "}
        <strong className="text-foreground">основной сценарий</strong> при регистрации и на следующем шаге — «создать
        компанию» или «пока только заказываю». Роль и выбор при онбординге — подсказки, а не жёсткие ограничения:
        тендеры могут создавать все, компанию в каталоге может добавить любой пользователь через{" "}
        <Link to="/create-company" className="text-primary font-medium hover:underline">
          создание компании
        </Link>{" "}
        или раздел{" "}
        <Link to="/profile" className="text-primary font-medium hover:underline">
          «Мои компании»
        </Link>{" "}
        в личном кабинете.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Роли и возможности</h2>
      <p className="text-muted-foreground text-sm">
        Главные правила одинаковы для всех: нельзя отправить заявку самому себе и нельзя купить свой товар или услугу.
        Для отклика на тендер нужна хотя бы одна ваша компания.
      </p>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-semibold">Действие</th>
              <th className="text-left p-3 font-semibold">Гость</th>
              <th className="text-left p-3 font-semibold">Вошли в аккаунт</th>
              <th className="text-left p-3 font-semibold">Есть своя компания</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="p-3">Смотреть каталог, услуги, материалы, тендеры</td>
              <td className="p-3">Да</td>
              <td className="p-3">Да</td>
              <td className="p-3">Да</td>
            </tr>
            <tr>
              <td className="p-3">Заявка в компанию из каталога</td>
              <td className="p-3">Нет</td>
              <td className="p-3">Да</td>
              <td className="p-3">Да</td>
            </tr>
            <tr>
              <td className="p-3">Заказать услугу / купить материал</td>
              <td className="p-3">Нет</td>
              <td className="p-3">Да (не свой товар)</td>
              <td className="p-3">Да (не свой товар)</td>
            </tr>
            <tr>
              <td className="p-3">Создать тендер</td>
              <td className="p-3">Нет</td>
              <td className="p-3">Да</td>
              <td className="p-3">Да</td>
            </tr>
            <tr>
              <td className="p-3">Откликнуться на тендер</td>
              <td className="p-3">Нет</td>
              <td className="p-3">Нет¹</td>
              <td className="p-3">Да²</td>
            </tr>
            <tr>
              <td className="p-3">Публиковать услуги и материалы</td>
              <td className="p-3">Нет</td>
              <td className="p-3">Нет¹</td>
              <td className="p-3">Да</td>
            </tr>
            <tr>
              <td className="p-3">Принимать входящие заявки в чат</td>
              <td className="p-3">Нет</td>
              <td className="p-3">Да³</td>
              <td className="p-3">Да</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        ¹ Без компании в профиле. ² Только если тендер «Открыт», не ваш и выбрана ваша компания. ³ В том числе отклики
        на ваши тендеры, если у вас нет компании — заявки приходят напрямую в профиль.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Поиск и каталог</h2>
      <p>
        На главной странице и в шапке сайта можно искать компании, услуги, материалы и тендеры — система перенаправит
        вас в нужный раздел. В{" "}
        <Link to="/catalog" className="text-primary font-medium hover:underline">
          каталоге компаний
        </Link>{" "}
        доступны фильтры по городу и категории. Поставщики, подрядчики и заказчики могут написать компании из каталога
        наравне друг с другом.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Заявки и чат</h2>
      <p>
        Кнопки «Отправить заявку», «Заказать услугу», «Купить товар» или «Откликнуться на тендер» создают диалог и сразу
        открывают чат. Переписка и статусы — в{" "}
        <Link to="/profile" className="text-primary font-medium hover:underline">
          личном кабинете
        </Link>
        , вкладка «Заявки и чаты». В первом сообщении — единый блок «Источник» (каталог, услуги, материалы, тендер или
        витрина роликов) со ссылкой на карточку.
      </p>
      <p className="text-sm text-muted-foreground">
        Исходящие заявки показывают компанию или пользователя-получателя. Входящие — заказчика; отклики на ваш тендер без
        компании у автора приходят лично в профиль (не в карточку компании).
      </p>
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">Шаблоны договоров:</strong>{" "}
        <Link to="/contracts" className="text-primary font-medium hover:underline">
          страница «Шаблоны договоров»
        </Link>
        — скачать текст (.txt), оформить и подписать офлайн. Готовый PDF или скан можно передать контрагенту через кнопку
        со скрепкой в чате заявки (вложение до 20 МБ, видно только участникам диалога).
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Обновление базы (для администратора)</h2>
      <p className="text-sm text-muted-foreground">
        Чтобы отклики на тендеры без компании у автора работали, в Supabase должны быть применены миграции (SQL Editor или{" "}
        <code className="text-xs bg-muted px-1 rounded">supabase db push</code>), в том числе:
      </p>
      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
        <li>
          <code className="text-xs bg-muted px-1 rounded">20260520150000_tender_type_and_request_recipient.sql</code> —
          поле <code className="text-xs bg-muted px-1 rounded">recipient_profile_id</code> у заявок
        </li>
        <li>
          <code className="text-xs bg-muted px-1 rounded">20260520160000_sync_company_review_stats.sql</code> — рейтинг из
          отзывов
        </li>
        <li>
          <code className="text-xs bg-muted px-1 rounded">20260521120000_request_source_tender.sql</code> — связь отклика с
          тендером (<code className="text-xs bg-muted px-1 rounded">source_tender_id</code>)
        </li>
      </ul>
      <p className="text-sm text-muted-foreground">
        После миграций перезапустите фронтенд. Тестовые аккаунты — файл{" "}
        <code className="text-xs bg-muted px-1 rounded">supabase/seed_test_accounts.sql</code> (пароль{" "}
        <code className="text-xs bg-muted px-1 rounded">123456</code>).
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Тендеры</h2>
      <p>
        Тендер может создать любой авторизованный пользователь — укажите тип задачи, город, бюджет и срок. На витрине
        видны все статусы (открыт, в работе, закрыт); отклик возможен только на открытые. Автор видит блок{" "}
        <strong className="text-foreground">«Отклики»</strong> на карточке тендера и в профиле → «Мои тендеры»: список
        участников, кнопки «Чат», «Принять» (тендер переходит в «В работе») и «Закрыть тендер». Вручную перевести
        открытый тендер в «В работе» можно только после хотя бы одного отклика; без откликов пункт недоступен. После «Принять»
        статус «Открыт» вручную недоступен — используйте кнопку{" "}
        <strong className="text-foreground">«Снова принимать отклики»</strong>, чтобы снять выбор исполнителя и снова
        принимать отклики. Список — в разделе{" "}
        <Link to="/tenders" className="text-primary font-medium hover:underline">
          Тендеры
        </Link>
        .
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Рейтинг и отзывы</h2>
      <p>
        Звёзды в каталоге и на карточке компании считаются <strong className="text-foreground">только из реальных отзывов</strong>{" "}
        в таблице <code className="text-xs bg-muted px-1 rounded">reviews</code>. Если отзывов нет — показывается «Нет
        отзывов», а не демо-цифры из seed.
      </p>
      <p>
        Оставить отзыв может только заказчик после <strong className="text-foreground">завершённой заявки</strong> с
        компанией: в чате нажмите «Завершить заявку», затем «Оставить отзыв» или откройте карточку компании. Один отзыв
        на компанию от одного пользователя.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Верификация компаний</h2>
      <p>
        После создания компании владелец загружает документы (выписка о регистрации, удостоверение представителя и при
        необходимости доверенность) в разделе <strong className="text-foreground">«Верификация»</strong> в управлении
        компанией и нажимает <strong className="text-foreground">«Отправить на проверку»</strong>. В каталоге отображаются
        только компании со статусом <code className="text-xs bg-muted px-1 rounded">verified</code> и бейджем{" "}
        <strong className="text-foreground">«Проверено»</strong>.
      </p>
      <p>
        Модератор (роль <code className="text-xs bg-muted px-1 rounded">moderator</code> или{" "}
        <code className="text-xs bg-muted px-1 rounded">admin</code>) проверяет заявки на странице{" "}
        <strong className="text-foreground">«Модерация»</strong> в меню профиля. Тестовый модератор:{" "}
        <code className="text-xs bg-muted px-1 rounded">moderator@test.com</code> /{" "}
        <code className="text-xs bg-muted px-1 rounded">123456</code>. Если вход не работает — один раз выполните в SQL Editor файл{" "}
        <code className="text-xs bg-muted px-1 rounded">supabase/seed_moderator_account.sql</code> (аккаунт добавлен позже полного seed).
      </p>
      <p className="text-sm text-muted-foreground">
        Миграции:{" "}
        <code className="text-xs bg-muted px-1 rounded">20260523120000_company_verification.sql</code>, отзывы и жалобы —{" "}
        <code className="text-xs bg-muted px-1 rounded">20260522120000_trust_reviews_and_reports.sql</code>.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Жалобы</h2>
      <p>
        Кнопка <strong className="text-foreground">«Пожаловаться»</strong> есть на карточке компании и у чужих тендеров — жалоба
        сохраняется в таблице <code className="text-xs bg-muted px-1 rounded">reports</code> для ручной проверки.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Управление компанией</h2>
      <p>
        Владелец компании редактирует профиль, портфолио, услуги, материалы, ролики на витрине и отвечает на заявки.
        Раздел управления — с карточки компании после входа. Создать компанию можно при любой роли в настройках профиля.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Перед выкладкой в прод</h2>
      <p>
        Чеклист деплоя и команда <code className="text-xs bg-muted px-1 rounded">npm run smoke</code> описаны в файле{" "}
        <code className="text-xs bg-muted px-1 rounded">DEPLOY_CHECKLIST.md</code> в репозитории. Минимум: все миграции
        Supabase, переменные <code className="text-xs bg-muted px-1 rounded">.env</code> на Vercel, smoke в браузере по
        тестовым аккаунтам из <code className="text-xs bg-muted px-1 rounded">seed_test_accounts.sql</code>.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Не получается войти или загрузить данные</h2>
      <p>
        Проверьте подключение к интернету и обновите страницу. Если ошибка повторяется, напишите нам через страницу{" "}
        <Link to="/contacts" className="text-primary font-medium hover:underline">
          Контакты
        </Link>{" "}
        — укажите email аккаунта и кратко опишите проблему.
      </p>
    </section>
  </InfoPageLayout>
);

export default Help;
