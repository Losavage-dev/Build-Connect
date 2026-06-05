# Фаза 1 — Production & Auth (инструкция)

**Цель:** вход и API работают на https://build-connect-market.vercel.app/  
**Время:** ~30–60 мин (ваши шаги в Dashboard)

---

## Шаг 1. Supabase Auth URLs

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard) → ваш проект  
2. **Authentication → URL Configuration**
3. Установите:

| Поле | Значение |
|------|----------|
| **Site URL** | `https://build-connect-market.vercel.app` |
| **Redirect URLs** | `https://build-connect-market.vercel.app/**` |
| | `http://localhost:8080/**` |

4. Сохраните.

---

## Шаг 2. Vercel env (Production)

1. [Vercel Dashboard](https://vercel.com) → проект BuildConnect → **Settings → Environment Variables**
2. Проверьте на **Production**:
   - `VITE_SUPABASE_URL` = URL из Supabase (Settings → API)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` или `VITE_SUPABASE_ANON_KEY`
3. Если меняли — **Redeploy** последнего деплоя.

---

## Шаг 3. Миграции (37 шт.)

Локально (если ещё не делали после последних миграций):

```bash
cd buildconnectmarket
npx supabase link --project-ref ВАШ_REF
npx supabase db push
```

Или в SQL Editor сверьте, что есть таблицы `user_events`, `reports`, bucket `request-attachments`.

---

## Шаг 4. Realtime

Supabase → **Database → Publications** → `supabase_realtime`:

- [ ] `messages`
- [ ] `notifications`

(Обычно уже включено миграцией `20260519100000_realtime_messages_notifications.sql`.)

---

## Шаг 5. Проверка входа (вы в браузере)

| # | Действие | OK |
|---|----------|-----|
| 1 | Открыть https://build-connect-market.vercel.app/catalog | [ ] |
| 2 | `/auth` → `client@test.com` / `123456` | [ ] |
| 3 | Профиль / inbox без ошибок в консоли | [ ] |
| 4 | Выход → снова вход | [ ] |
| 5 | `moderator@test.com` → `/moderation` | [ ] |

Отметьте в [QA_CHECKLIST.md](QA_CHECKLIST.md) раздел «0. Production & Auth».

---

## Шаг 6. Локальная автопроверка (мы)

```bash
npm run smoke
npm run build
```

---

## Exit criteria Фазы 1

- [ ] Site URL и Redirect на prod
- [ ] Vercel env на Production
- [ ] Вход `client@test.com` на **prod**
- [ ] Smoke + build зелёные

**После этого → [Фаза 2](PROJECT_COMPLETION_PLAN.md#фаза-2--функциональный-qa)** (полный QA).

---

## Опционально (не блокер)

- Переименовать Vercel project → `buildconnect` (URL станет `buildconnect.vercel.app`)
- Custom domain позже — см. [ROADMAP.md](ROADMAP.md)
