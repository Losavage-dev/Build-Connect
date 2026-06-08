# 09 — Architecture reference (no diagrams)

Tables, routes, and enums — appendix for the report. Diagrams: [01](01-system-context.md) – [08](08-authentication.md).

---

## Key tables

| Table | Role |
|-------|------|
| `profiles` | User profile, role, ban |
| `companies` | Company card, rating, `verification_status` |
| `requests` | Deal / application, status |
| `messages` | Chat per request |
| `tenders` | Customer RFQ |
| `services` | Public vitrine (services & materials) |
| `reviews` | Ratings after completed request (company, B2B trust) |
| `email_outbox` | Email notification queue (optional Resend) |
| `notifications` | In-app inbox |
| `company_documents` | Verification files |
| `reports` | User complaints |
| `user_events` | Recommendation signals |
| `company_promo_posts` | Promo video feed |
| `moderation_actions` | Staff audit log |

Schema: `supabase/migrations/`, types: `src/integrations/supabase/types.ts`.

---

## Enums

| Enum | Values |
|------|--------|
| `user_role` | `client`, `contractor`, `supplier` (+ staff via seed) |
| `request_status` | `pending`, `accepted`, `rejected`, `completed` |
| `verification_status` | `draft`, `pending`, `verified`, `rejected`, `suspended`, `revoked` |

---

## Main routes (`App.tsx`)

| Path | Access |
|------|--------|
| `/`, `/catalog`, `/company/:id` | Public |
| `/tenders`, `/services`, `/materials`, `/feed` | Public (actions may require login) |
| `/auth` | Public |
| `/profile`, `/chat/:requestId`, `/contracts` | Authenticated |
| `/complete-profile` | Authenticated (onboarding) |
| `/create-company`, `/company/:id/manage` | Authenticated |
| `/moderation` | `moderator`, `admin` |

---

## Storage buckets

| Bucket | Purpose |
|--------|---------|
| `avatars` | Profile photos |
| `logos` | Company logos |
| `projects` | Portfolio images |
| `company-documents` | Verification uploads |
| `request-attachments` | Chat attachments |

---

## Related docs

- [DEPLOY_GUIDE.md](../../DEPLOY_GUIDE.md) — deploy (no diagram)  
- [PROJECT_AUDIT.md](../../PROJECT_AUDIT.md) — features  
- [DIPLOMA_DEMO.md](../../DIPLOMA_DEMO.md) — demo script  
