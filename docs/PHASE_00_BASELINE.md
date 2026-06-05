# Фаза 0 — Базовая линия (зафиксировано)

**Дата фиксации:** 2026-05-20  
**Production:** https://build-connect-market.vercel.app/

---

## Продукт (одной строкой)

B2B-маркетплейс строительной отрасли KZ: **доверие** (верификация, отзывы, модерация) + **сделка** (заявка → чат → статус → отзыв).

---

## Стек (факт)

| Слой | Технология |
|------|------------|
| Frontend | React 18, Vite, TypeScript, TanStack Query, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime, PostgREST) |
| Hosting | Vercel CDN |
| Security | RLS + JWT + `capabilities.ts` (advisory) |

---

## Автопроверки (локально)

```
npm run smoke   → OK (37 migrations, REST tables OK)
npm run build   → OK
```

---

## Seed (ваши данные)

| Скрипт | Содержимое |
|--------|------------|
| `seed_test_accounts.sql` | 8 аккаунтов @test.com, 4 компании, тендеры, услуги, материалы, 12 completed requests, 12 reviews |
| `seed_moderator_account.sql` | Дубликат/отдельный модератор (если нужен отдельно от #8 в test seed) |

**Пароль всех test:** `123456`

---

## Реализованные модули (код)

- [x] Auth, роли, complete profile, ban
- [x] Catalog, filters, recommendations
- [x] Company profile, portfolio, manage
- [x] Tenders, bids, my tenders
- [x] Services, materials, promo feed
- [x] Requests, chat, attachments, status updates
- [x] Reviews (after completed)
- [x] Verification + moderator panel + reports
- [x] Contract templates DOCX/PDF
- [x] Architecture docs (9 diagrams)

---

## Известные расхождения с PDF диплома

| Диплом | Реальность |
|--------|------------|
| Microservices (заключение) | SPA-BaaS |
| BIN / KATO API | Нет в коде; города — список KZ |
| Appendix Docker + `/api/*` | Supabase REST |

Исправляем в **Фазе 6**.

---

## Следующий шаг

→ **[Фаза 1](PROJECT_COMPLETION_PLAN.md#фаза-1--production--auth-)** — Auth URLs и вход на production.
