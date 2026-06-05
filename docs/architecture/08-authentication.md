# 08 — Authentication & session

**Purpose:** sign-up, profile bootstrap, session, and access gates.

[← Marketplace](07-marketplace.md) · [Architecture hub](../ARCHITECTURE.md) · [Reference →](09-reference.md)

---

## Diagram

```mermaid
%%{init: {'theme': 'base'}}%%
flowchart TB

  subgraph Reg["Registration"]
    A1["Auth.tsx\nsignUp + role"]
    A2["Supabase Auth\nauth.users"]
    A3["Trigger handle_new_user"]
    A4["INSERT profiles"]
    A1 --> A2 --> A3 --> A4
  end

  subgraph Session["Each visit"]
    B1["AuthProvider\ngetSession"]
    B2{"banned_until?"}
    B3["load profiles"]
    B4["React state\nuser + profile"]
    B1 --> B2
    B2 -->|ban active| Out["signOut"]
    B2 -->|ok| B3 --> B4
  end

  subgraph Gates["Before protected pages"]
    G1["ProtectedRoute"]
    G2["RequireCompleteProfile"]
    G1 --> G2
  end

  Reg --> Session
  Session --> Gates

  style A4 fill:#f0f9ff,stroke:#0284c7
  style B4 fill:#fff7ed,stroke:#ea580c
```

### Описание для документации (Рисунок 9)

**Рисунок 9. Аутентификация и контроль доступа.**

При регистрации роль пользователя передаётся в метаданные Supabase Auth; триггер в PostgreSQL создаёт запись в `profiles`. При каждом запуске приложения `AuthProvider` восстанавливает сессию JWT и загружает профиль; при активной блокировке выполняется выход. Перед защищёнными страницами проверяется наличие входа и заполненность обязательных полей профиля (имя, телефон, город).

Files: `src/contexts/AuthContext.tsx`, `src/pages/Auth.tsx`, `supabase/migrations/20240328000004_auto_profile.sql`.

---

[Reference tables →](09-reference.md)
