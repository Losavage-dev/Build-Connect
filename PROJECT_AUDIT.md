# BuildConnect — справочник проекта

Краткий обзор для диплома и сопровождения. Детали — в [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) и [docs/architecture/09-reference.md](docs/architecture/09-reference.md).

## Назначение

B2B-маркетплейс строительной отрасли Казахстана: каталог компаний, тендеры, услуги и материалы, заявки, чат, модерация и верификация.

| Роль | Описание |
|:---|:---|
| **client** | Заказчик: тендеры, заявки, отзывы |
| **contractor** | Подрядчик: компания, отклики, услуги |
| **supplier** | Поставщик: материалы, витрина |
| **moderator / admin** | Модерация, верификация, жалобы |

## Стек

**Frontend:** React 18, TypeScript, Vite, Tailwind, shadcn/ui, TanStack Query, React Router.  
**Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime, RLS).  
**Deploy:** Vercel + Supabase Cloud.

## База данных

Схема и связи — в [docs/architecture/05-data-model.md](docs/architecture/05-data-model.md).  
Миграции: `supabase/migrations/` (**41** файл).  
Демо-данные: `seed_test_accounts.sql`, `seed_moderator_account.sql`.

## Маршруты

| Маршрут | Доступ |
|:---|:---|
| `/`, `/catalog`, `/company/:id`, `/feed`, `/help` | Публично |
| `/auth`, `/complete-profile` | Авторизация / онбординг |
| `/profile`, `/tenders`, `/services`, `/materials`, `/chat/:id`, `/contracts` | Авторизованные |
| `/create-company`, `/company/:id/manage` | По роли |
| `/moderation` | moderator, admin |

## Реализованный функционал

- Регистрация, профиль, фиксация ФИО после заполнения
- Каталог, тендеры, услуги, материалы, promo feed
- Заявки, realtime-чат, статусы, отзывы
- Верификация компаний, модерация, жалобы
- Rule-based рекомендации (`user_events`)
- Экспорт шаблонов договоров (DOCX/PDF)

**Production:** https://build-connect-market.vercel.app/

## Документация

| Документ | Назначение |
|:---|:---|
| [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) | Деплой и чеклист |
| [DIPLOMA_DEMO.md](DIPLOMA_DEMO.md) | Сценарий защиты |
| [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md) | Функциональный QA |
| [docs/QA_GUIDE.md](docs/QA_GUIDE.md) | Пошаговая инструкция QA |
| [docs/SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md) | Безопасность |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Развитие после MVP |
