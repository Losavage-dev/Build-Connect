# Security Checklist — BuildConnect

**Принцип:** безопасность обеспечивает **PostgreSQL RLS** и политики Storage, не скрытие anon key.

Production: https://build-connect-market.vercel.app/

---

## 1. Secrets

| # | Проверка | OK |
|---|----------|-----|
| S1 | `service_role` **не** в Vercel env и не в git | [ ] |
| S2 | Только `VITE_SUPABASE_URL` + publishable/anon key на фронте | [ ] |
| S3 | `.env` в `.gitignore` | [ ] |

---

## 2. Supabase Auth

| # | Проверка | OK |
|---|----------|-----|
| S4 | Site URL = prod Vercel | [ ] |
| S5 | Redirect URLs только ваши домены | [ ] |
| S6 | Email confirm: осознанный выбор (demo vs prod) | [ ] |
| S7 | Password min length enforced (Zod + Auth) | [ ] |

---

## 3. RLS (ручные тесты под двумя аккаунтами)

| # | Атака | Ожидание | OK |
|---|-------|----------|-----|
| S8 | User A открывает `/chat/{id}` заявки User B | Нет доступа / редирект | [ ] |
| S9 | User A UPDATE чужой `companies` через API | 403 / 0 rows | [ ] |
| S10 | User A INSERT review без completed request | Отказ | [ ] |
| S11 | User A INSERT review на свою компанию | Отказ | [ ] |
| S12 | Non-moderator INSERT в `moderation_actions` | Отказ | [ ] |
| S13 | Non-moderator `/moderation` route | Redirect | [ ] |

---

## 4. Storage

| # | Bucket | Проверка | OK |
|---|--------|----------|-----|
| S14 | `company-documents` | Чужой не скачивает без policy | [ ] |
| S15 | `request-attachments` | Только участник заявки | [ ] |
| S16 | `logos`, `avatars` | Public read OK | [ ] |

---

## 5. Client vs server

| # | Проверка | OK |
|---|----------|-----|
| S17 | `capabilities.ts` дублирует RLS, но RLS главнее | [ ] |
| S18 | XSS: сообщения чата экранируются React | [ ] |

---

## 6. Demo accounts (после защиты)

| # | Действие | OK |
|---|----------|-----|
| S19 | Сменить пароли @test.com или отключить публичный доступ к demo | [ ] |
| S20 | Не публиковать пароль `123456` в открытом README на prod | [ ] |

---

## 7. Realtime

| # | Проверка | OK |
|---|----------|-----|
| S21 | Подписка только на свои `request_id` / `recipient_id` | [ ] |

---

**Фаза 4 завершена:** все S1–S18 отмечены; S19–S21 по желанию до/после защиты.
