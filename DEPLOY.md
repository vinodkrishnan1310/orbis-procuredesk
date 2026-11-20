# Deploy: GitHub → Vercel + Neon

Repository: **https://github.com/vinodkrishnan1310/orbis-procuredesk**

## 1. Vercel (one-time)

```bash
npx vercel login
cd /Users/nidhipillay/Documents/Projects/OrbisProcureDesk
npx vercel link          # create/link "orbis-procuredesk"
npx vercel --prod        # production deploy
```

Or import in the browser: [Import on Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvinodkrishnan1310%2Forbis-procuredesk).

## 2. Neon via Vercel Marketplace (recommended)

1. Vercel project → **Storage** → **Create Database** → **Neon** (or **Integrations** → Neon).
2. Connect to this project; Vercel sets **`DATABASE_URL`** automatically.
3. Redeploy after storage is attached.

## 2b. Neon standalone (alternative)

```bash
npx neonctl login
npx neonctl projects create --name orbis-procuredesk
npx neonctl connection-string --project-id <id>   # copy into Vercel env as DATABASE_URL
```

## 3. Required Vercel environment variables

Set for **Production** (and Preview if you test there):

| Variable | Suggested value |
| --- | --- |
| `DATABASE_URL` | From Neon integration |
| `SESSION_SECRET` | 32+ random bytes (e.g. `openssl rand -base64 32`) |
| `CLERK_PASSWORD` | Demo password for `ap.clerk` |
| `APPROVER_PASSWORD` | Demo password for `finance.approver` |
| `SENIOR_PASSWORD` | Demo password for `senior.approver` |
| `RESET_SECRET` | Secret for `x-reset-secret` header |

## 4. Initialize production database

From your laptop (with `DATABASE_URL` pointing at the Neon branch Vercel uses):

```bash
export DATABASE_URL='postgresql://...'
npm run db:reset
```

Or after deploy:

```bash
curl -X POST "https://YOUR-VERCEL-URL/api/admin/reset" \
  -H "x-reset-secret: YOUR_RESET_SECRET"
```

(Reset runs migrate + seed on the server.)

## 5. Demo hygiene

- **Settings → Deployment Protection**: disable Vercel Authentication on **Production** so the Bot can open the URL in a private window without a Vercel login.
- Fill `<PORTAL_URL>` in `demo-assets/grok-bot-setup-guide.md` with your production URL.

## 6. Verify

```bash
curl https://YOUR-VERCEL-URL/api/health
# {"ok":true}
```