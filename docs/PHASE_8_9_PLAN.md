# Фаза 8–9: рекомендации и документы

Краткий план реализации поверх текущего стека (React + Supabase). Не код — дорожная карта для согласования.

---

## A. Рекомендательная система

### Цель

Подсказывать релевантные **компании**, **услуги**, **материалы**, **тендеры** и **ролики** без «чёрного ящика»: сначала простые правила, потом персонализация по действиям.

### Уже есть в проекте

- Поиск (`resolveUniversalSearchPath`)
- Фильтры город / категория
- Сортировка каталога по `rating`
- В PromoFeed — задел под «лайки и комментарии для рекомендаций»

### Этап A1 — Правила без ML (1–2 недели)

**Единый сервис** `src/lib/recommendations/`:

| Функция | Вход | Логика |
|---------|------|--------|
| `scoreCompany(company, ctx)` | профиль, город, категории просмотра | +город совпадает, +verified, +рейтинг, −уже контактировал |
| `scoreTender(tender, ctx)` | роль, `myCompanyIds`, город | открытые в городе пользователя, тип под роль подрядчика/поставщика |
| `scoreListing(service/material)` | история заявок, категория | та же категория, что в прошлых заявках |

**Контекст `ctx`:** `profile.city`, `profile.role`, `myCompanyIds`, опционально `recentViews` из `localStorage` или таблицы `user_events`.

**UI:**

- Блок **«Рекомендуем вам»** на главной (3–6 карточек)
- В каталоге — переключатель «По рейтингу» / «Для вас»
- На странице тендера — «Похожие тендеры» (город + тип)

**БД (минимум):**

```sql
-- опционально, фаза A1.5
create table user_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  event_type text not null, -- view_company, view_tender, bid, order, like_promo
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb,
  created_at timestamptz default now()
);
```

RLS: пользователь пишет только свои события; чтение только своих (для персонализации).

### Этап A2 — Коллаборативная простота (2–3 недели)

- «Компании, с которыми работали похожие заказчики» — SQL: компании из `requests` того же города/категории, исключая уже просмотренные
- «Популярное в вашем городе» — `count(requests)` за 30 дней по `company_id`
- Ролики: сортировка по `likes` + категории из `company_categories`

### Этап A3 — ML / внешний сервис (позже)

- Эмбеддинги описаний (OpenAI / local) в `pgvector` — поиск «похожих» тендеров и компаний
- Имеет смысл только при объёме данных; до диплома достаточно A1–A2

### Приоритет внедрения

1. Главная + каталог (компании)
2. Тендеры для подрядчиков/поставщиков
3. Услуги/материалы
4. PromoFeed

---

## B. Работа с документами

### Цель

Прикреплять **договоры, сметы, КП, акты** к заявкам, тендерам и компаниям; хранить в Supabase Storage; показывать в чате и профиле.

### Типы документов

| Область | Примеры | Кто загружает |
|---------|---------|----------------|
| Заявка / чат | КП, смета, договор | обе стороны |
| Тендер | ТЗ, проектная документация | автор тендера |
| Компания | лицензия, сертификат | владелец (для verified) |

### Этап B1 — Storage + метаданные (1–2 недели)

**Миграция:**

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references profiles(id),
  bucket text not null default 'documents',
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  -- привязка (одна из)
  request_id uuid references requests(id) on delete cascade,
  tender_id uuid references tenders(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  visibility text not null default 'participants'
    check (visibility in ('participants', 'owner_only', 'public')),
  created_at timestamptz default now()
);
```

**Storage:** bucket `documents` (private), signed URLs для скачивания (Supabase `createSignedUrl`).

**RLS:**

- INSERT: участник заявки / автор тендера / admin компании
- SELECT: те же + публичные документы компании для каталога (только `visibility = public'`)

**UI:**

- `DocumentUpload` в `Chat.tsx` — вкладка «Файлы»
- `TenderForm` / карточка тендера — вложения ТЗ
- `ManageCompany` — публичные сертификаты (для модерации verified)

### Этап B2 — Версии и статусы (2 недели)

- `document_versions` или поле `version` + `replaces_id`
- Статусы: `draft` → `sent` → `signed` (для договоров)
- Уведомление в `notifications` при новом файле в чате

### Этап B3 — Шаблоны и генерация (опционально)

- Шаблоны договора (Handlebars / PDF на edge function)
- Не обязательно для MVP диплома

### Ограничения

- Макс. размер файла (например 10 MB) — проверка на клиенте + policy storage
- Типы: pdf, docx, xlsx, jpg, png
- Антивирус — вне scope; для прода — disclaimer

---

## C. Порядок работ после фазы 7

```text
Фаза 7 (эксплуатация) ✅
    ↓
Фаза 8a — user_events + рекомендации на главной/каталоге
    ↓
Фаза 8b — рекомендации тендеры + витрины
    ↓
Фаза 9a — documents + chat attachments
    ↓
Фаза 9b — документы тендера/компании, signed URLs
```

### Оценка трудозатрат

| Блок | MVP | Полный |
|------|-----|--------|
| Рекомендации A1 | 3–5 дней | +1–2 недели A2 |
| Документы B1 | 4–6 дней | +1–2 недели B2 |

---

## D. Что согласовать перед стартом

1. Рекомендации: достаточно ли правил (город + роль + рейтинг) для диплома?
2. Документы: только чат или сразу тендер + компания?
3. Private bucket + signed URL vs публичные ссылки?
4. Нужна ли модерация загрузок до публикации?

После ответов можно начать с **фазы 8a** (таблица `user_events` + блок на главной).
