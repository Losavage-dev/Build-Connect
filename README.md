# BuildConnect

B2B-маркетплейс для строительной отрасли Казахстана: каталог компаний, тендеры, витрина услуг и материалов, заявки и realtime-чат. Фронтенд — **React 18 + Vite + TypeScript + Tailwind + shadcn/ui**, бэкенд — **Supabase** (PostgreSQL, Auth, Storage, Realtime).

## Основной вариант: Supabase Cloud (без Docker)

Для разработки и демо **не нужен** Docker: фронт крутится на вашем ПК, а база и авторизация — в облаке [supabase.com](https://supabase.com).

1. Создайте проект в Supabase (регион, например, **Frankfurt** или **Mumbai**).
2. Примените миграции из `supabase/migrations/` по порядку (все файлы по дате в имени, включая `20260514120000_api_grants.sql`) — через **SQL Editor** или CLI `supabase link` + `supabase db push` (Docker для этого **не** требуется).
3. Скопируйте **Project URL** и **anon key** (Settings → API).
4. В корне проекта:
   ```bash
   cd buildconnectmarket
   cp .env.example .env
   ```
   Впишите в `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Установите зависимости и запустите фронт:
   ```bash
   npm install
   npm run dev
   ```
   Если в консоли слишком много лишних **Network** URL (старые Ethernet, виртуальные адаптеры), в `.env` добавьте строку `DEV_SERVER_HOST=10.202.27.47` (ваш IPv4 из Wi‑Fi, см. `ipconfig`) и снова `npm run dev` — Vite будет слушать только этот адрес; открывайте сайт как `http://10.202.27.47:8080` (и у друга тот же URL). При смене сети обновите IP.
6. В Supabase: **Authentication → URL Configuration** — укажите `http://localhost:8080` (или ваш порт Vite) в **Site URL** и в **Redirect URLs** (`http://localhost:8080/**`), чтобы вход и сброс пароля работали локально.
7. Для демо-данных см. раздел «Seed» в [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md).

Полная пошаговая инструкция (облако + Vercel + Auth + seed): **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)**.  
Сценарий защиты диплома (10–15 мин, тестовые аккаунты): **[DIPLOMA_DEMO.md](DIPLOMA_DEMO.md)**.

## Требования

- Node.js 18+
- npm
- Аккаунт Supabase (бесплатный тариф достаточно)

Опционально: [Supabase CLI](https://supabase.com/docs/guides/cli) (`npx supabase …`) для `link` / `db push` без ручной вставки SQL.

## Локальный Supabase + Docker (опционально)

Нужен только если хотите **полностью офлайн-БД** на своём ПК:

- [Docker Desktop](https://docs.docker.com/desktop/)
- Команды: `npx supabase start`, затем `npx supabase db reset` (поднимет контейнеры и применит миграции + `seed.sql`).

Без Docker эти команды работать не будут — используйте облако, как выше.

## Сборка

```bash
npm run build
npm run preview
```

Результат в каталоге `dist/`. Деплой фронта на **Vercel** — см. [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md).

## Документация по коду

- [PROJECT_AUDIT.md](PROJECT_AUDIT.md) — функции, таблицы, ограничения.

## Лицензия

Приватный учебный / дипломный проект.
