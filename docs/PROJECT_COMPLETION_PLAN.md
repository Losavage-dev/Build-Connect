# BuildConnect — план завершения проекта

**Роль документа:** дорожная карта до состояния «готовый дипломный продукт + уверенность в качестве».  
**Production URL:** https://build-connect-market.vercel.app/  
**Seed (выполнено вами):** `seed_test_accounts.sql`, `seed_moderator_account.sql`

---

## Критерии «проект завершён»

| # | Критерий | Как проверяем |
|---|----------|----------------|
| 1 | Идея из диплома реализована | Чеклист функций (Фаза 2) |
| 2 | Production стабилен | Vercel + Supabase, smoke, QA |
| 3 | Безопасность на уровне RLS | Security checklist (Фаза 4) |
| 4 | Демо-данные «живые» | Rich seed + verified компании (Фаза 3) |
| 5 | Диплом = код | PDF без microservices/BIN-API там, где нет в коде (Фаза 6) |
| 6 | Видение настоящее + будущее | ROADMAP.md (Фаза 7) |

---

## Фазы (строго по порядку)

| Фаза | Название | Срок | Статус |
|------|----------|------|--------|
| **0** | Базовая линия | 1 день | ✅ см. [PHASE_00_BASELINE.md](PHASE_00_BASELINE.md) |
| **1** | Production & Auth | 1–2 дня | 🔄 в работе |
| **2** | Функциональный QA | 2–3 дня | ⏳ |
| **3** | Rich demo data | 2–3 дня | ⏳ |
| **4** | Security audit | 1–2 дня | ⏳ |
| **5** | Продуктовый polish | 2–4 дня | ⏳ |
| **6** | Диплом & документация | параллельно | ⏳ |
| **7** | Roadmap v2 | 1 день | ⏳ |

---

## Фаза 0 — Базовая линия ✅

- [x] Репозиторий собирается (`npm run build`)
- [x] Smoke локально (`npm run smoke`) — 37 миграций, таблицы OK
- [x] Production открывается ([Vercel](https://build-connect-market.vercel.app/))
- [x] Seed test accounts выполнен
- [x] План зафиксирован (этот файл)

**Следующий шаг:** Фаза 1.

---

## Фаза 1 — Production & Auth 🔄

**Цель:** вход, регистрация и API работают на **prod**, без сюрпризов на защите.

| # | Задача | Ответственный | Done |
|---|--------|---------------|------|
| 1.1 | Supabase Auth: Site URL = `https://build-connect-market.vercel.app` | Вы (Dashboard) | [ ] |
| 1.2 | Redirect URLs: prod + `http://localhost:8080/**` | Вы | [ ] |
| 1.3 | Vercel env: `VITE_SUPABASE_*` на Production | Вы | [ ] |
| 1.4 | Вход `client@test.com` / `123456` на **prod** | Вы + мы | [ ] |
| 1.5 | Все 37 миграций применены (`db push` или сверка) | Вы | [ ] |
| 1.6 | Realtime: publications `messages`, `notifications` | Supabase Dashboard | [ ] |
| 1.7 | Опционально: переименовать проект Vercel → `buildconnect` | Вы | [ ] |

**Артеfact:** отметки в [DEPLOY_CHECKLIST.md](../DEPLOY_CHECKLIST.md) + [QA_CHECKLIST.md](QA_CHECKLIST.md) раздел «Prod Auth».  
**Пошагово:** [PHASE_01_PRODUCTION_AUTH.md](PHASE_01_PRODUCTION_AUTH.md)

---

## Фаза 2 — Функциональный QA

**Цель:** каждая кнопка и сценарий из [DIPLOMA_DEMO.md](../DIPLOMA_DEMO.md) на production.

Использовать [QA_CHECKLIST.md](QA_CHECKLIST.md) — 40+ пунктов по модулям.

**Exit criteria:** все пункты P0 (критичные) зелёные; P1 — не более 3 известных багов с workaround.

---

## Фаза 3 — Rich demo data

**Цель:** каталог «не пустой», профили заполнены, есть история сделок.

| Задача | Файл |
|--------|------|
| Расширить seed: +компании, promo, pending verification | `supabase/seed_demo_rich.sql` (создадим) |
| Логотипы компаний (Storage или URL) | SQL + инструкция |
| 1–2 компании в статусе `pending` для модератора | seed |

**Не перезапускать** `seed_test_accounts.sql` на prod без бэкапа — скрипт удаляет `@test.com`.

---

## Фаза 4 — Security audit

**Цель:** RLS, Storage, роли — «нельзя легко прочитать чужое».

Чеклист: [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)

- Ручные попытки IDOR (чужой chat, чужая company UPDATE)
- Storage policies
- Demo-пароли: для prod после защиты — сменить или отдельный demo-проект

---

## Фаза 5 — Product polish

Приоритет после зелёного QA:

1. Поле **БИН** в компании (без гос API) — согласование с дипломом  
2. **Пагинация** каталога / тендеров  
3. **Error Boundary** на App  
4. Zod на оставшихся формах  
5. Playwright: 5 smoke e2e (опционально, но рекомендуется)

---

## Фаза 6 — Диплом & документация

- Заключение PDF: **SPA-BaaS**, не microservices  
- Appendix: убрать Docker-only API, описать Supabase  
- BIN/KATO: «перспектива» или поле БИН в UI  
- Скриншоты с **prod URL**  
- `PROJECT_AUDIT.md` синхронизировать с кодом  

---

## Фаза 7 — Roadmap (видение будущего)

Документ [ROADMAP.md](ROADMAP.md): v1.1 (после защиты) vs v2 (egov, escrow, ML).

---

## Ритм работы с ассистентом

1. Завершаем фазу → отмечаем `[x]` в этом файле.  
2. Баги → issue-список в `docs/QA_BUGS.md` (создадим при первом баге).  
3. Коммиты — по вашей просьбе, логичными порциями по фазам.

---

## Текущий фокус

**Сейчас: Фаза 1** — проверка Auth на production и чеклист DEPLOY.

После вашего подтверждения входа на prod → **Фаза 2** (полный QA по таблице).
