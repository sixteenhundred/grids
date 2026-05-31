# Deploying GRID (shareable demo link)

GRID is a Next.js 16 app with libSQL/Drizzle + Better Auth. The fastest hosted
setup is **Vercel** (app) + **Turso** (database). ~15 minutes end to end.

The production build is verified passing (`npm run build`).

---

## 1. Database — Turso (libSQL)

The code already supports libSQL with an auth token (`src/lib/db/index.ts`),
so this is just config.

```bash
# install + log in (one-time)
brew install tursodatabase/tap/turso
turso auth login

# create the database
turso db create grid-prod

# get the two values you'll need
turso db show grid-prod --url          # -> libsql://grid-prod-xxxx.turso.io
turso db tokens create grid-prod       # -> the auth token
```

Create the tables in Turso (run from the project root):

```bash
DATABASE_URL="libsql://grid-prod-xxxx.turso.io" \
DATABASE_AUTH_TOKEN="<token>" \
npm run db:push
```

## 2. App — Vercel

**Option A — dashboard (no CLI):**
1. Push this repo to GitHub.
2. vercel.com → New Project → import the repo → Framework: Next.js (auto).
3. Add the Environment Variables below → Deploy.

**Option B — CLI:**
```bash
npm i -g vercel
vercel            # link/create the project
vercel --prod     # deploy
```

## 3. Environment variables (set in Vercel → Settings → Environment Variables)

| Key | Value |
|---|---|
| `DATABASE_URL` | `libsql://grid-prod-xxxx.turso.io` |
| `DATABASE_AUTH_TOKEN` | the Turso token from step 1 |
| `BETTER_AUTH_SECRET` | a long random string — generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | your final URL, e.g. `https://grid.vercel.app` |

After the first deploy you'll get the URL — set `NEXT_PUBLIC_APP_URL` to it and
redeploy once so auth cookies use the right origin.

## 4. First login on the live site

The hosted database starts empty (your local accounts are not copied). On the
live URL, open `/signup` and create an account — that's your demo login. Use the
**Creator / Client** toggle (top-right) to show both sides.

---

### Notes
- Most feature state (Studio, Community, Finance, Transfers, My Operation
  customization, etc.) is stored in the browser's `localStorage` — great for a
  demo, per-device. Shop, Academy, and auth use the Turso database.
- `.env.local`, `local.db`, and archive zips are gitignored and never deployed.
