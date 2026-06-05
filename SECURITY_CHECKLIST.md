# SECURITY_CHECKLIST.md — Domain & DNS hardening (GRID)

Domain-layer protection splits into **(A) automated in-app** (this repo) and
**(B) manual, out-of-band** steps at the registrar / DNS provider that *cannot*
live in code. Do both. Scope: GRID's own domain (a single app on Vercel — there
is no multi-tenant `domains` table).

## A. Automated (in this repo)
- **Security headers** on every response — `next.config.ts` `headers()`: HSTS
  (`max-age=63072000; includeSubDomains; preload`), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (camera/mic/geo/payment disabled), and a CSP.
- **CSP is REPORT-ONLY today** (so it can't break the locked UI). To enforce:
  open the app, confirm there are no CSP violations in the browser console, then
  rename the header `Content-Security-Policy-Report-Only` → `Content-Security-Policy`
  in `next.config.ts`. Follow-up: replace `script-src 'unsafe-inline'` with
  per-request nonces via the Proxy.
- **HTTP→HTTPS** is handled by Vercel at the edge (plus `upgrade-insecure-requests`
  in the CSP) — no app-level redirect needed.
- **DNS posture checker** — `verifyDomainSecurity(domain)` in
  `src/lib/security/domain-security.ts` (DNSSEC / CAA / SPF / DMARC / DKIM /
  dangling-CNAME), returning `{ check, status: pass|warn|fail, detail, fix }[]`.
  Unit-tested with mocked DNS (`domain-security.test.ts`).
- **Scheduled monitors** — CT-log monitor + dangling-record sweep via Vercel Cron
  → `GET /api/cron/domain-security` (guarded by `CRON_SECRET`). Anomalies go to
  the monitoring channel (Sentry once `SENTRY_DSN` is set) and are always written
  to `audit_event`.
- **Admin report** — `GET /api/admin/domain-security` (admin-only) returns the
  latest `verifyDomainSecurity` report for our domain.

## B. Manual — registrar / DNS provider (do once, verify yearly)
> These live OUTSIDE the codebase. The in-app checker only *detects* them.

**Registrar**
- [ ] **Registrar lock** (`clientTransferProhibited` / Registrar-Lock) enabled.
- [ ] **2FA** on the registrar account, the DNS provider, and Vercel.
- [ ] **Auto-renew on**; expiry monitored; WHOIS privacy on.
- [ ] Registrant email on an address **not** hosted on this domain (avoid lockout).

**DNS / DNSSEC**
- [ ] **DNSSEC activated** at the DNS provider **and** the **DS record** published
      at the registrar (the chain needs both). Verify: `dig DS <domain> +short`.
- [ ] **CAA** restricting issuance to your CA(s), e.g.
      `<domain>. CAA 0 issue "letsencrypt.org"` (+ Vercel's CA) and
      `<domain>. CAA 0 iodef "mailto:security@<domain>"`.

**Email auth** (the domain sends mail via Resend)
- [ ] **SPF** — one `v=spf1 include:resend.com ... -all` (or `~all`) record.
      **Never `+all`.**
- [ ] **DMARC** — `_dmarc.<domain> TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@<domain>"`
      (at least `p=quarantine`; move to `p=reject` once you've monitored reports).
- [ ] **DKIM** — the provider selector (e.g. `resend._domainkey`) published & resolving.

**Subdomains / takeover**
- [ ] No **dangling CNAMEs** pointing at de-provisioned Vercel/S3/GitHub/Heroku/etc.
      targets. The sweep flags these; remove the stale record at the DNS provider.

**Vercel**
- [ ] Custom domain verified. Submit to **hstspreload.org** *only after* HSTS is
      confirmed stable (preload is hard to reverse).
- [ ] Deployment protection / team 2FA enabled.
