# Чеклист деплоя BuildConnect (фаза 7 + диплом)

Используйте перед каждым релизом на Vercel + Supabase Cloud. Для защиты диплома см. **[DIPLOMA_DEMO.md](DIPLOMA_DEMO.md)**.

## 1. База данных

- [ ] `npx supabase link --project-ref ВАШ_REF`
- [ ] `npx supabase db push` — без ошибок (**34** миграции)
- [ ] В SQL Editor: `supabase/diploma_quick_setup.sql` — проверка таблиц (NOTICE)
- [ ] Seed для демо: `seed_test_accounts.sql`, затем `seed_moderator_account.sql` (пароль `123456`)

### Все миграции (см. `supabase/migrations/`, порядок по имени)

К последним относятся:

| Файл | Зачем |
|------|--------|
| `20260528120000_notifications_grant_unban_warning.sql` | notifications, разбан |
| `20260529120000_user_events_recommendations.sql` | user_events, RPC трендов |
| `20260529120001_user_events_grants.sql` | GRANT на user_events |
| `20260530120000_reports_initiated_by_staff.sql` | флаг жалобы от модератора |

## 2. Переменные окружения

Локально (`.env`) и на Vercel:

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` (или `VITE_SUPABASE_ANON_KEY`)

## 3. Supabase Auth

- [ ] **URL Configuration**: Site URL = URL Vercel (и `http://localhost:8080` для dev)
- [ ] **Redirect URLs**: `https://ваш-домен/**`, `http://localhost:8080/**`
- [ ] Email: для демо отключить обязательное подтверждение или подтвердить тестовых пользователей

## 4. Автоматическая проверка

```bash
cd buildconnectmarket
npm run smoke
npm run build
```

## 5. Ручной smoke (браузер)

| # | Сценарий | Ожидание |
|---|----------|----------|
| 1 | Гость: `/`, `/catalog`, `/tenders` | Списки или пусто, без ошибок API |
| 2 | `client@test.com` — заявка в каталог | Чат, источник в сообщении |
| 3 | `contractor1@test.com` — отклик на тендер | Отклик у автора в «Мои тендеры» |
| 4 | Автор — «Принять» → «Завершить заявку» | Тендер закрыт, отзыв доступен |
| 5 | «Пожаловаться» на компанию/тендер | Toast успеха |
| 6 | `moderator@test.com` — жалоба, бан, журнал | Действия без `permission denied` |
| 7 | Модератор — верификация компании | Approve / revoke «Проверено» |
| 8 | Регистрация с коротким паролем | Toast Zod «не короче 6 символов» |
| 9 | Главная / каталог «Для вас» после просмотра компаний | Блок «Рекомендуем вам» меняется |

## 6. Vercel

- [ ] Deploy прошёл, `dist` отдаётся
- [ ] Env variables на Preview и Production
- [ ] После деплоя — один проход smoke на прод-URL

---

Подробнее: [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) · Демо для защиты: [DIPLOMA_DEMO.md](DIPLOMA_DEMO.md)
