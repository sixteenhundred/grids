# SETUP.md — stand up GRID 1.0 yourself

Step-by-step. Do the accounts in order. Stripe is **last** (everything is built to wait for it). Anything marked **→ send me** is what I need pasted back to proceed.

---

## 0. Prerequisites
- Node 20+, `npm`. Repo at `/Users/johnhope/grids`.
- Vercel project already linked (`prj_zbDTu1JmyKltoNwmMN6qaWx6fesy`).

---

## 1. Supabase (DB + Auth + Storage) — needed for Phase 0

1. Create account at supabase.com → **New project**.
2. **Region: EU (Frankfurt / `eu-central-1`)** — required for Norway/GDPR data residency.
3. Set a strong database password (save it).
4. When the project finishes provisioning, go to **Project Settings**:
   - **API**: copy `Project URL`, `anon` public key, `service_role` secret key.
   - **API → JWT**: copy the `JWT Secret`.
   - **Database → Connection string**: copy both the **Session pooler** (port 6543, for the app) and **Direct** (port 5432, for migrations) URIs.
5. **Storage**: leave default; I'll create the buckets + policies in code.

**→ send me:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, the **pooler** connection string, the **direct** connection string.
(Paste them privately — these are secrets. They go into Vercel env + `.env.local`, never the repo.)

**Also confirm:** the current Turso/`local.db` data is throwaway demo data with **no real users** (so I can migrate to a clean Supabase DB and discard it).

---

## 2. Email — Resend (recommended) — needed for Phase 1 (waitlist)

1. Create account at resend.com.
2. **Add a domain** you own (e.g. `grid.no` or a subdomain like `mail.grid.no`).
3. Resend shows DNS records (SPF, DKIM, DMARC) → add them at your domain registrar; wait for "Verified".
4. Create an **API key** (full access).

**→ send me:** `RESEND_API_KEY`, the verified **from-address** (e.g. `hello@grid.no` — not a personal Gmail), and the **inbox** that should receive new-signup notifications (e.g. `team@grid.no`).

---

## 3. Vercel — env + domain

1. I'll give you the full env-var list once Supabase/Resend keys exist; you paste them into **Vercel → Settings → Environment Variables** (Production + Preview).
2. Confirm the **production domain** (and add it to Vercel). Point email DNS at the same domain as in step 2.

**→ send me:** the production domain (e.g. `grid.no`).

---

## 4. Stripe — LAST (Phase 3 go-live only)

Do **not** do this yet. When the rest is built and you're ready:
1. Create Stripe account → enable **Connect** (platform).
2. Start in **test mode**. Create the subscription Products/Prices to match the approved tiers.
3. Settings → copy test **Publishable key**, **Secret key**; create a **webhook** to `https://<domain>/api/webhooks/stripe` and copy its **signing secret**; Connect settings → **client_id**.

**→ send me (later):** `STRIPE_SECRET_KEY` (test), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test), `STRIPE_WEBHOOK_SECRET`, Connect `client_id`. I'll wire and verify against test mode before any live key is ever used — and I will not touch money logic without showing you the diff first.

---

## Current blockers to start Phase 0
1. Supabase project created + the 6 credentials from §1 sent.
2. Confirmation that current data is disposable (§1).
3. Resend confirmed + keys from §2 (needed at Phase 1, not Phase 0 — can follow).

Once §1 lands, I begin the Postgres migration, Supabase Auth swap, and RLS.
