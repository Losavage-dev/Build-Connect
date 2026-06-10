# BuildConnect

B2B marketplace for Kazakhstan's construction industry: verified company catalog, tenders, services and materials listings, lead requests, and real-time chat.

**Live demo:** [build-connect-market.vercel.app](https://build-connect-market.vercel.app/)

## Overview

BuildConnect connects construction clients, contractors, and suppliers on a single platform. Companies publish profiles, portfolio projects, and marketplace listings; users browse without signing in and authenticate only when placing a request or order.

### Core features

| Area | Description |
|------|-------------|
| **Company catalog** | Search and filter verified companies by city and category |
| **Tenders** | Clients publish tenders; contractors submit bids and open chats |
| **Marketplace** | Public listings for services and building materials |
| **Company storefront** | Per-company offerings page with materials/services tabs and filters |
| **Price insights** | Platform median price comparison for material SKUs (phase 1) |
| **Promo feed** | YouTube-style company video showcase |
| **Requests & chat** | Real-time messaging, attachments, status workflow |
| **Reviews** | Company reviews after completed deals |
| **Moderation** | Verification queue, reports, staff actions |
| **Recommendations** | Rule-based personalization from `user_events` |
| **Contracts** | Client-side DOCX/PDF export from templates |

### User roles

`client` · `contractor` · `supplier` · `moderator` · `admin`

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), TanStack Query, React Router, Zod |
| Backend | Supabase — PostgreSQL, Auth, Storage, Realtime, Edge Functions |
| Deployment | Vercel (SPA) + Supabase Cloud |

Architecture is a **single-page application (SPA) with Backend-as-a-Service (BaaS)** — not a microservices setup.

## Quick start (Supabase Cloud)

Docker is **not required** for development. The frontend runs locally; database and auth live in [Supabase Cloud](https://supabase.com).

1. Create a Supabase project (e.g. region **Frankfurt** or **Mumbai**).
2. Apply migrations from `supabase/migrations/` in chronological order — via **SQL Editor** or CLI:
   ```bash
   npx supabase link --project-ref YOUR_REF
   npx supabase db push
   ```
3. Copy **Project URL** and **anon key** from Settings → API.
4. Configure environment:
   ```bash
   cd buildconnectmarket
   cp .env.example .env
   ```
   Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`.
5. Install and run:
   ```bash
   npm install
   npm run dev
   ```
   Default URL: `http://localhost:8080` (Vite picks the next free port if 8080 is busy).
6. In Supabase **Authentication → URL Configuration**, add your local URL to **Site URL** and **Redirect URLs** (e.g. `http://localhost:8080/**`).
7. Load demo data (SQL Editor, in order):
   - `supabase/seed_test_accounts.sql` — test users (password `123456`)
   - `supabase/seed_market_materials.sql` — demo suppliers and price-comparison data

Full deployment guide: **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)**  
Diploma demo script (10–15 min): **[DIPLOMA_DEMO.md](DIPLOMA_DEMO.md)**

### Optional: local Supabase + Docker

For a fully offline database on your machine:

```bash
npx supabase start
npx supabase db reset
```

Requires [Docker Desktop](https://docs.docker.com/desktop/).

## Requirements

- Node.js 18+
- npm
- Supabase account (free tier is sufficient)

Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) for `link` / `db push`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run smoke` | Pre-deploy connectivity check |

## Documentation

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — system architecture (diagrams + reference)
- **[docs/architecture/README.md](docs/architecture/README.md)** — architecture sections 01–09
- **[docs/ROADMAP.md](docs/ROADMAP.md)** — post-MVP roadmap
- **[PROJECT_AUDIT.md](PROJECT_AUDIT.md)** — features, tables, constraints

## Test accounts

After running `seed_test_accounts.sql`, password for all `@test.com` users is **`123456`**:

| Email | Role |
|-------|------|
| `client@test.com` | Client |
| `contractor1@test.com` | Contractor |
| `supplier@test.com` | Supplier |
| `moderator@test.com` | Moderator |

## License

Private academic / diploma project.
