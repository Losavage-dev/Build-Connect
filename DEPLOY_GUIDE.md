# Инструкция по деплою BuildConnect

## Основной путь: только Supabase Cloud

**Docker не нужен.** Достаточно проекта на [supabase.com](https://supabase.com) и файла `.env` с URL и anon-ключом; фронт запускается командой `npm run dev` на вашем компьютере, прод — на Vercel.

Краткий порядок:

1. Создать облачный проект Supabase (шаг 1 ниже).
2. Применить **все миграции** из `supabase/migrations/` по порядку (включая `20260514120000_api_grants.sql` — права для Data API, если при создании проекта отключали «Automatically expose new tables»).
3. Заполнить `.env` (шаг 2).
4. Настроить **Authentication → URL Configuration** для `localhost` и позже для URL Vercel (шаг 4).
5. По желанию: демо-данные из `supabase/seed.sql` (раздел «Демо-данные (seed)» ниже).
6. Задеплоить фронт на Vercel (шаг 3).

Локальный `supabase start` / `db reset` с Docker описан в [README.md](README.md) как **опциональный** вариант.

---

## Шаг 1: Создание Supabase Cloud проекта

### 1.1. Регистрация
1. Откройте [https://supabase.com](https://supabase.com)
2. Нажмите **"Start your project"**
3. Войдите через **GitHub** (рекомендуется) или Email

### 1.2. Создание проекта
1. Нажмите **"New Project"**
2. Заполните поля:
   - **Name:** `BuildConnect`
   - **Database Password:** придумайте надёжный пароль (сохраните его!)
   - **Region:** выберите ближайший к Казахстану → **Central EU (Frankfurt)** или **South Asia (Mumbai)**
   - **Pricing Plan:** Free (бесплатный)
3. Нажмите **"Create new project"**
4. Подождите 1-2 минуты, пока проект создаётся

### 1.3. Получение ключей
После создания проекта:
1. Перейдите в **Settings** → **API** (или на главную страницу проекта)
2. Скопируйте два значения:
   - **Project URL** — выглядит как: `https://abcdefghijk.supabase.co`
   - **anon public key** — длинная строка начинающаяся с `eyJ...`

> ⚠️ **ВАЖНО:** Сохраните оба значения! Они понадобятся дальше.

### 1.4. Применение миграций к облачной БД

#### Вариант A: Через Supabase CLI (удобно, Docker не нужен)

1. Один раз войдите в CLI (откроется браузер):

   ```bash
   npx supabase login
   ```

2. В папке проекта `buildconnectmarket` выполните (подставьте **project ref** из URL проекта, фрагмент между `https://` и `.supabase.co`):

   ```bash
   npx supabase link --project-ref ВАШ_PROJECT_REF
   ```

3. Отправьте миграции в облако:

   ```bash
   npx supabase db push
   ```

Команды `link` и `db push` обращаются к **удалённому** проекту; локальные контейнеры Docker для этого **не** запускаются.

#### Вариант B: Через SQL Editor (вручную)
Если CLI не работает:
1. В Supabase Dashboard → **SQL Editor**
2. Нажмите **"New query"**
3. Скопируйте содержимое файла `supabase/migrations/20240328000000_initial_schema.sql` → вставьте → нажмите **"Run"**
4. Повторите для (в том же порядке):
   - `20240328000001_new_features.sql`
   - `20240328000002_review_trigger.sql`
   - `20240328000003_storage.sql`
   - `20240328000004_auto_profile.sql`
   - `20240328000005_rls_policies.sql`
   - `20260514120000_api_grants.sql`
   - … все файлы из `supabase/migrations/` по порядку имени (полный список — [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md))

Перед деплоем: `npm run smoke` и `npm run build`.

---

## Демо-данные (seed) в облаке

Файл [`supabase/seed_test_accounts.sql`](supabase/seed_test_accounts.sql) создаёт **7 тестовых пользователей** (все роли и кейсы с/без компании), компании, тендеры, услуги и материалы.

1. Откройте **SQL Editor** в Dashboard Supabase.
2. Вставьте **весь** текст `supabase/seed_test_accounts.sql` и нажмите **Run**.
3. В конце скрипт выведет таблицу логинов; пароль у всех: **`123456`**.

Краткий seed на 3 пользователя: [`supabase/seed.sql`](supabase/seed.sql) (устарел для QA — лучше `seed_test_accounts.sql`).

Если `auth.users` отклонится политиками окружения: **Authentication → Users → Add user** с тем же email и паролем, затем повторите блок `DO $$` из скрипта (без INSERT в auth).

---

## Шаг 1b: Auth для локальной разработки (облачная БД)

Пока вы открываете приложение с `http://localhost:8080`:

1. **Authentication → URL Configuration**
2. **Site URL:** `http://localhost:8080` (на время разработки можно так; для продакшена потом смените на URL Vercel).
3. **Redirect URLs:** добавьте `http://localhost:8080/**`

Для демо до защиты часто отключают обязательное подтверждение email:

- **Authentication → Providers → Email** — снимите галочку с **Confirm email** (если доступно в вашей версии Dashboard), либо подтверждайте регистрацию по ссылке из письма Supabase.

---

## Шаг 2: Обновление .env

После получения ключей от Supabase Cloud, откройте файл `.env` в проекте и замените:

```env
VITE_SUPABASE_URL="https://ВАШ_PROJECT_REF.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="ВАШ_ANON_KEY"
```

---

## Шаг 3: Деплой на Vercel

### 3.1. Подготовка
1. Убедитесь, что проект залит на **GitHub**:
   ```bash
   cd d:/BuildConnect/buildconnectmarket
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

### 3.2. Подключение к Vercel
1. Откройте [https://vercel.com](https://vercel.com)
2. Войдите через **GitHub**
3. Нажмите **"Add New..." → "Project"**
4. Найдите репозиторий `buildconnectmarket` → нажмите **"Import"**

### 3.3. Настройка проекта
1. **Framework Preset:** выберите `Vite`
2. **Build Command:** `npm run build` (должен определиться автоматически)
3. **Output Directory:** `dist`
4. **Environment Variables** — нажмите "Add" и добавьте:
   - `VITE_SUPABASE_URL` = `https://ВАШ_PROJECT_REF.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `ВАШ_ANON_KEY`
5. Нажмите **"Deploy"**

### 3.4. Готово!
Через 1-2 минуты сайт будет доступен по адресу:
`https://buildconnectmarket.vercel.app` (или похожему)

---

## Шаг 4: Настройка Supabase для продакшена

### 4.1. Разрешить домен Vercel (и при необходимости localhost)

1. В Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL:** укажите основной URL приложения:
   - для **прода:** `https://ваш-проект.vercel.app` (или свой домен);
   - при разработке против **облачной** БД можно временно держать `http://localhost:8080`, но тогда OAuth-редиректы на проде настройте отдельно через список Redirect URLs.
3. В **Redirect URLs** добавьте как минимум:
   - `https://ваш-проект.vercel.app/**`
   - для локальной разработки с облачным Supabase: `http://localhost:8080/**`

### 4.2. (Опционально) Google OAuth
1. В Supabase Dashboard → **Authentication** → **Providers**
2. Включите **Google**
3. Для настройки нужны Client ID и Secret из Google Cloud Console
4. Следуйте инструкции в Supabase: [Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

## Шаг 5: Свой домен (опционально)

### На Vercel:
1. **Settings** → **Domains** → **Add Domain**
2. Введите ваш домен (например, `buildconnect.kz`)
3. Vercel покажет DNS-записи, которые нужно добавить у вашего регистратора

### В Supabase:
1. Обновите **Site URL** на ваш домен
2. Обновите **Redirect URLs**

---

## Чек-лист деплоя

- [ ] Создан проект Supabase Cloud
- [ ] Скопированы URL и Anon Key
- [ ] Применены все миграции из `supabase/migrations` (по порядку, включая `api_grants`)
- [ ] Обновлен `.env` с облачными ключами
- [ ] Проект залит на GitHub
- [ ] Подключен Vercel
- [ ] Добавлены Environment Variables в Vercel
- [ ] Настроены **Site URL** и **Redirect URLs** (Vercel + при необходимости localhost)
- [ ] (Опционально) Выполнен `seed.sql` в SQL Editor для демо-аккаунтов
- [ ] Сайт работает! 🎉
