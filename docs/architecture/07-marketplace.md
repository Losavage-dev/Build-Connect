# 07 — Marketplace → request

**Purpose:** all user entry points that create the same deal primitive (`requests` + chat).

[← Frontend](06-frontend.md) · [Architecture hub](../ARCHITECTURE.md) · [Next: Authentication →](08-authentication.md)

---

## Diagram

```mermaid
%%{init: {'theme': 'base'}}%%
flowchart TB

  subgraph Sources["Discovery & demand"]
    direction TB
    CAT["Catalog\n/company/:id"]
    TEN["Tenders\nbid"]
    SVC["Services\norder"]
    MAT["Materials\norder"]
    FEED["Promo feed\n/feed"]
  end

  HUB["requests\n+ first message"]
  CHAT["Chat\n/chat/:requestId"]
  ST["status:\npending → accepted → completed"]

  CAT --> HUB
  TEN --> HUB
  SVC --> HUB
  MAT --> HUB
  FEED --> HUB

  HUB --> CHAT
  CHAT --> ST

  style HUB fill:#fff7ed,stroke:#ea580c,stroke-width:2px
```

### Описание для документации (Рисунок 8)

**Рисунок 8. Сценарии маркетплейса, сходящиеся в заявку.**

Разные разделы интерфейса (каталог, тендеры, витрины услуг и материалов, промо-лента) реализуют разный UX, но одну backend-модель: создаётся **заявка** и **первое сообщение**, далее ведётся **чат** и меняется **статус** сделки. Так достигается единый канал коммуникации между заказчиком и подрядчиком/поставщиком.

---

[Next: Authentication →](08-authentication.md)
