# BuildConnect — Architecture

B2B marketplace for Kazakhstan’s construction industry.

## Summary

| Aspect | Choice |
|--------|--------|
| **Style** | Jamstack BaaS — React SPA + Supabase |
| **Frontend** | React 18, Vite, TypeScript, TanStack Query, React Router |
| **Backend** | Supabase (PostgreSQL, Auth, PostgREST, Realtime, Storage) |
| **Deal unit** | `requests` + `messages` |
| **Hosting** | Vercel (SPA) + Supabase Cloud |

---

## Diagrams for the report (9 figures)

| Fig. | Document | Content |
|------|----------|---------|
| 1 | [01-system-context](architecture/01-system-context.md) | Context: users, BuildConnect, Supabase, YouTube |
| 2 | [02-containers](architecture/02-containers.md) | Containers: browser, SPA, Supabase services, DB |
| 3 | [03-core-process](architecture/03-core-process.md) | Request statuses |
| 4 | [04-request-sequence](architecture/04-request-sequence.md) | Create request + chat (sequence) |
| 5 | [05-data-model](architecture/05-data-model.md) | Core ER diagram |
| 6 | [06-frontend](architecture/06-frontend.md) | React provider stack |
| 7 | [06-frontend](architecture/06-frontend.md) | Route guards |
| 8 | [07-marketplace](architecture/07-marketplace.md) | Catalog / tenders / vitrines → request |
| 9 | [08-authentication](architecture/08-authentication.md) | Registration, session, gates |

Index: [architecture/README.md](architecture/README.md).

**Appendix (no diagrams):** [09-reference](architecture/09-reference.md) — tables, routes, buckets.

---

## Roles

| Role | Actions |
|------|---------|
| `client` | Tenders, orders, reviews |
| `contractor` | Company, bids, services |
| `supplier` | Materials |
| `moderator` / `admin` | `/moderation` |

`src/lib/capabilities.ts` + RLS in `supabase/migrations/`.

---

## Core process (one paragraph)

Any marketplace CTA → **`requests`** + first **`message`** → **`/chat/:id`** → **`completed`** → **`reviews`**. Notifications via DB triggers; Realtime for inbox.

---

## Repository

```text
src/          — App, pages, hooks, lib, supabase client
supabase/     — migrations (schema + RLS + triggers)
docs/architecture/  — diagrams 01–09
```

---

## Other docs

- [PROJECT_COMPLETION_PLAN.md](PROJECT_COMPLETION_PLAN.md) — дорожная карта до «готового» проекта  
- [QA_CHECKLIST.md](QA_CHECKLIST.md) · [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) · [ROADMAP.md](ROADMAP.md)  
- [DEPLOY_GUIDE.md](../DEPLOY_GUIDE.md) · [PROJECT_AUDIT.md](../PROJECT_AUDIT.md) · [DIPLOMA_DEMO.md](../DIPLOMA_DEMO.md)  
