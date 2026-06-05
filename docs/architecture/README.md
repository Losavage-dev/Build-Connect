# Architecture documentation

**BuildConnect** — основные диаграммы для пояснительной записки + справочник без схем.

## Diagrams (for report)

| Fig. | File | Topic |
|------|------|--------|
| 1 | [01-system-context.md](01-system-context.md) | System context (C4) |
| 2 | [02-containers.md](02-containers.md) | Containers: SPA, Supabase |
| 3 | [03-core-process.md](03-core-process.md) | Request status lifecycle |
| 4 | [04-request-sequence.md](04-request-sequence.md) | Create request + chat (sequence) |
| 5 | [05-data-model.md](05-data-model.md) | Core ER model |
| 6 | [06-frontend.md](06-frontend.md) | Provider stack |
| 7 | [06-frontend.md](06-frontend.md) | Route guards (same file) |
| 8 | [07-marketplace.md](07-marketplace.md) | Marketplace → request |
| 9 | [08-authentication.md](08-authentication.md) | Auth & session |

**Hub:** [../ARCHITECTURE.md](../ARCHITECTURE.md)

## Reference (no diagrams)

| File | Content |
|------|---------|
| [09-reference.md](09-reference.md) | Tables, routes, enums, buckets |

## Viewing

GitHub preview or [mermaid.live](https://mermaid.live) → SVG for Word / draw.io.

## When to update

| Change | File |
|--------|------|
| External actors / hosting | `01` |
| Supabase APIs | `02` |
| Request status | `03` |
| createRequest flow | `04` |
| New core table | `05`, `09` |
| App.tsx providers / routes | `06`, `09` |
| New marketplace entry | `07` |
| Auth / profile | `08` |

## Other

- [DEPLOY_GUIDE.md](../../DEPLOY_GUIDE.md)  
- [PROJECT_AUDIT.md](../../PROJECT_AUDIT.md)  
