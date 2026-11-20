# Orbis ProcureDesk

Fictional legacy-style procurement and accounts-payable portal for AI browser-agent demos. Business data is available only through server-rendered HTML forms—no business JSON API (except health and admin reset).

## Assumptions

- Node 20+ and npm.
- Postgres is hosted on [Neon](https://neon.tech); connection string in `DATABASE_URL`.
- Demo passwords live only in environment variables (see `.env.example`).
- Currency is USD; amounts render like `1,234.50`.
- Sessions last 8 hours (`SESSION_SECRET`, `jose` HMAC cookie).
- Vercel Hobby deployment: no writable filesystem at runtime; reset reseeds via Postgres only.
- `lib/seed.ts` is the single source for deterministic seed data; `lib/seed-data.ts` shares constants with PDF generation.

## Local setup

```bash
cp .env.example .env.local
# Set DATABASE_URL, SESSION_SECRET, CLERK_PASSWORD, APPROVER_PASSWORD, SENIOR_PASSWORD, RESET_SECRET

npm install
npm run db:reset
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login). Demo users: `ap.clerk`, `finance.approver`, `senior.approver` (passwords from env).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `SESSION_SECRET` | HMAC secret for session JWT cookie |
| `CLERK_PASSWORD` | Password for `ap.clerk` |
| `APPROVER_PASSWORD` | Password for `finance.approver` |
| `SENIOR_PASSWORD` | Password for `senior.approver` |
| `RESET_SECRET` | Header secret for `POST /api/admin/reset` |

## Deploying to Vercel Hobby + Neon

1. Push this repo and import the project in Vercel.
2. Add **Neon Postgres** from the Vercel Marketplace and attach `DATABASE_URL` to the project.
3. Set all variables from `.env.example` in Vercel project settings.
4. Deploy, then run migrations against production once: `DATABASE_URL=... npm run db:reset` from your machine (or use Neon SQL console with `db/schema.sql` and call the reset endpoint).
5. Open **Settings → Deployment Protection** in Vercel and confirm the production URL loads in a private browser window **without** a Vercel login gate (required for the demo).

## Reset between demo runs

```bash
curl -X POST "https://YOUR-PORTAL.example/api/admin/reset" \
  -H "x-reset-secret: YOUR_RESET_SECRET"
```

Returns `{"ok":true}` and restores the seeded database state.

## Generate demo assets

```bash
npm run generate:invoices
```

Writes PDFs under `demo-assets/invoices/`, plus `emails.csv`, `policy.csv`, `bot-instructions.md`, and `slack-templates.md` (the Grok setup guide is maintained at `demo-assets/grok-bot-setup-guide.md`).

## Grok Bot setup

See [demo-assets/grok-bot-setup-guide.md](demo-assets/grok-bot-setup-guide.md).

## Six demo invoice cases

| Invoice | Intended match-check / workflow outcome |
| --- | --- |
| MS-10231 | Clean match; payment request prepared |
| BL-7782 | Unit price ~10% over PO → exception |
| CP-5519 | Duplicate of paid seed invoice → stop |
| DP-3305 | Amounts match; bank-change email → escalate |
| FH-9004 | Match; total above senior threshold |
| EF-2210 | No PO; two ambiguous Evergreen POs → ask requester |

## Scripts

- `npm run db:migrate` — apply `db/schema.sql`
- `npm run db:seed` — truncate and seed
- `npm run db:reset` — migrate + seed
- `npm run test` — Vitest (match-check logic)
- `npm run lint` / `npm run typecheck` / `npm run build`

## Pre-demo checklist

- [ ] Production URL loads without Vercel login (Deployment Protection).
- [ ] `ap.clerk` login works; failed login appears in audit log.
- [ ] Reset endpoint returns 401 without secret, `{"ok":true}` with secret.
- [ ] All six cases entered via `/invoices/new` show expected Match check results.