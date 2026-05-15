# Чеклист деплоя BuildConnect (фаза 7 + диплом)

Используйте перед каждым релизом на Vercel + Supabase Cloud. Для защиты диплома см. **[DIPLOMA_DEMO.md](DIPLOMA_DEMO.md)**.

## 1. База данных

- [ ] `npx supabase link --project-ref ВАШ_REF`
- [ ] `npx supabase db push` — без ошибок (**33** миграции)
- [ ] В SQL Editor: `supabase/diploma_quick_setup.sql` — проверка таблиц (NOTICE)
- [ ] Seed для демо: `seed_test_accounts.sql`, затем `seed_moderator_account.sql` (пароль `123456`)

### Все миграции (31 файл, порядок по имени)

| # | Файл | Зачем |
|---|------|--------|
| 1–6 | `20240328000000` … `000005` | Схема, профили, storage, RLS |
| 7 | `20260514120000_api_grants.sql` | Data API grants |
| 8 | `20260515120000` … `15130000` | Витрина, проекты, удаление участника заявки |
| 9 | `20260516120000_company_promo_feed.sql` | Промо-лента |
| 10 | `20260517100000_company_categories_and_role_cooldown.sql` | Категории, кулдаун смены роли |
| 11 | `20260518120000` … `18140000` | Промо, уведомления, dedupe |
| 12 | `20260519100000_realtime_messages_notifications.sql` | Realtime |
| 13 | `20260520120000` … `20160000` | Город тендера, материалы, тип тендера, рейтинг |
| 14 | `20260521120000_request_source_tender.sql` | CRM откликов |
| 15 | `20260522120000_trust_reviews_and_reports.sql` | Отзывы, жалобы |
| 16 | `20260523120000_company_verification.sql` | Верификация, moderator |
| 17 | `20260524120000_verification_grants_and_visibility.sql` | Документы, видимость |
| 18 | `20260525120000` … `25130000` | Grants и staff update для reports |
| 19 | `20260526120000` … `26120001` | Suspend, действия модератора |
| 20 | `20260527120000` … `27120002` | Revoked, журнал, ban, каталог |
| 21 | `20260528120000_notifications_grant_unban_warning.sql` | INSERT в notifications, разбан, предупреждение |

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
