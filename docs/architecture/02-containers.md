## Container diagram

```mermaid
%%{init: {'theme': 'base', 'flowchart': {'curve': 'linear', 'padding': 20}}}%%
flowchart TB
  User["User browser"]

  subgraph ClientHost["Static hosting"]
    SPA["Single Page Application\nReact + Vite\ndist/ on Vercel"]
  end

  subgraph Supabase["Supabase Cloud project"]
    direction TB

    Auth["Supabase Auth\nGoTrue"]
    REST["PostgREST\nauto REST over public schema"]
    RT["Realtime server\nlogical replication"]
    Storage["Storage API\nS3-compatible buckets"]
    PG[("PostgreSQL 15+\npublic + auth schemas")]
    Edge["Edge Functions\noptional — not in core flows"]

    Auth -.->|"auth schema"| PG
    Auth -.->|"JWT validated by"| REST
    REST --> PG
    RT -->|"LISTEN / publication"| PG
    Storage -->|"metadata & policies"| PG
  end

  User -->|"HTTPS — loads SPA from CDN"| SPA

  SPA -->|"HTTPS /auth/v1\nsession, signIn, JWT"| Auth
  SPA -->|"HTTPS /rest/v1\nanon key + Bearer JWT"| REST
  SPA -->|"WSS /realtime/v1\nanon key + JWT"| RT
  SPA -->|"HTTPS /storage/v1\nupload, public URL"| Storage

  style SPA fill:#fff7ed,stroke:#ea580c,stroke-width:2px
  style Auth fill:#f0f9ff,stroke:#0284c7
  style REST fill:#f0f9ff,stroke:#0284c7
  style RT fill:#f0f9ff,stroke:#0284c7
  style Storage fill:#f0f9ff,stroke:#0284c7
  style PG fill:#f0f9ff,stroke:#0284c7
  style Edge fill:#fafaf9,stroke:#a8a29e,stroke-dasharray:4
```

> **Env:** один `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY` (anon) — база для всех четырёх вызовов из `supabase-js` (`src/integrations/supabase/client.ts`).

## Container responsibilities

| Container | Technology | Responsibility |
|-----------|------------|----------------|
| **SPA** | React 18, TypeScript | UI, routing, form validation (Zod), client capability checks, orchestrating API calls |
| **Supabase Auth** | Managed | Email/password sign-up, sessions, JWT refresh |
| **PostgREST** | Managed | CRUD on tables; enforces RLS per request |
| **PostgreSQL** | Managed | Data, triggers, functions, RLS policies |
| **Realtime** | Managed | Push `INSERT` on `messages`, `notifications` to subscribed clients |
| **Storage** | Managed | Binary objects; bucket-level policies |
| **Vercel (typical)** | CDN + SPA rewrite | Serves `index.html` for client routes (`vercel.json`) |

## Protocol matrix

| From | To | Protocol | Payload |
|------|-----|----------|---------|
| SPA | Auth | HTTPS `/auth/v1` | email, password, session, JWT (same project URL + anon key) |
| SPA | PostgREST | HTTPS `/rest/v1` | JSON rows, filters, RPC; `Authorization: Bearer` |
| SPA | Realtime | WebSocket `/realtime/v1` | `postgres_changes` subscriptions |
| SPA | Storage | HTTPS `/storage/v1` | multipart upload, public URLs |
| Auth | PostgreSQL | SQL | `auth` schema (users, sessions metadata) |
| PostgREST | PostgreSQL | SQL | parameterized queries + RLS on `public` |
| Realtime | PostgreSQL | logical replication | listens to published tables |
| Storage | PostgreSQL | SQL | object metadata, bucket policies |
| Triggers | PostgreSQL | — | side effects (notifications, ratings) |

## Data authority

```mermaid
flowchart LR
  subgraph Authoritative["Authoritative (server)"]
    RLS["RLS policies"]
    TR["Triggers & functions"]
    CHK["CHECK constraints"]
  end

  subgraph Advisory["Advisory (client)"]
    CAP["capabilities.ts"]
    ZOD["Zod schemas"]
    PR["ProtectedRoute"]
  end

  SPA["React SPA"] --> Advisory
  SPA -->|"mutations"| Authoritative
  Advisory -.->|"must match"| Authoritative
```

## Environment configuration

| Variable | Consumer | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | SPA | Base URL for Auth, REST, Realtime, Storage (one Supabase project) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | SPA | Anon key on every API call (RLS-bound; not only Auth) |
| Supabase service role | **Not in SPA** | Migrations / admin scripts only |

## Scaling & limits (conceptual)

- **SPA:** horizontally scaled via CDN; stateless.  
- **Supabase:** connection pooling, RLS per row — suitable for diploma / SMB B2B scale.  
- **Heavy work** (PDF/DOCX contract export): runs **in browser** (`contractDocumentExport.ts`), not on server.

---

[Next: Core process →](03-core-process.md)

