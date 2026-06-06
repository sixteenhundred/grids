/**
 * Domain DNS-security validator (Objective: domain hardening).
 *
 * `verifyDomainSecurity(domain)` checks DNSSEC, CAA, SPF, DMARC, DKIM and
 * dangling-CNAME (subdomain-takeover) posture and returns a structured report.
 * Built on DNS-over-HTTPS (works on Vercel serverless — no UDP — and supports
 * DS/CAA/DNSSEC, which node:dns does not). The resolver is injectable so the
 * logic is unit-testable with mocked DNS (see domain-security.test.ts).
 *
 * Intentionally dependency-free (only `fetch`) and NOT `server-only`, so it runs
 * under `node --test`. Call it from server contexts only.
 */

export type CheckStatus = "pass" | "warn" | "fail";
export type CheckResult = {
  check: string;
  status: CheckStatus;
  detail: string;
  /** Concrete remediation step shown to the admin (empty when status === pass). */
  fix: string;
  /** Critical failures should block/flag domain activation. */
  critical?: boolean;
};
export type DomainSecurityReport = {
  domain: string;
  checks: CheckResult[];
  summary: { pass: number; warn: number; fail: number; critical: number; blockActivation: boolean };
};

/** Minimal DNS-over-HTTPS JSON response (Google/Cloudflare shape). */
export type DohResponse = { Status: number; AD?: boolean; Answer?: { name: string; type: number; data: string }[] };
export type Resolver = (name: string, type: string) => Promise<DohResponse>;

const TYPE = { A: 1, CNAME: 5, TXT: 16, CAA: 257, DS: 43 } as const;

/** Default DoH resolver (Google). `do=1` requests DNSSEC validation (AD flag). */
export const dohResolver: Resolver = async (name, type) => {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}&do=1`;
  const res = await fetch(url, { headers: { accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`DoH ${type} ${name} → HTTP ${res.status}`);
  return (await res.json()) as DohResponse;
};

const recordData = (r: DohResponse, type: number): string[] =>
  (r.Answer ?? []).filter((a) => a.type === type).map((a) => a.data);
const txt = (r: DohResponse): string[] => recordData(r, TYPE.TXT).map((d) => d.replace(/"/g, "").trim());

/** Hostname suffixes that are takeover-prone when the CNAME target is unclaimed. */
const TAKEOVER_PATTERNS: { re: RegExp; service: string }[] = [
  { re: /\.vercel-dns\.com$|\.vercel\.app$/i, service: "Vercel" },
  { re: /\.s3[.-].*amazonaws\.com$|\.s3\.amazonaws\.com$/i, service: "AWS S3" },
  { re: /\.cloudfront\.net$/i, service: "AWS CloudFront" },
  { re: /\.github\.io$/i, service: "GitHub Pages" },
  { re: /\.herokudns\.com$|\.herokuapp\.com$/i, service: "Heroku" },
  { re: /\.azurewebsites\.net$|\.blob\.core\.windows\.net$|\.cloudapp\.net$/i, service: "Azure" },
  { re: /\.netlify\.app$|\.netlify\.com$/i, service: "Netlify" },
  { re: /\.pages\.dev$/i, service: "Cloudflare Pages" },
  { re: /\.fastly\.net$/i, service: "Fastly" },
  { re: /\.ghost\.io$/i, service: "Ghost" },
  { re: /\.wpengine\.com$/i, service: "WP Engine" },
  { re: /\.surge\.sh$/i, service: "Surge" },
  { re: /\.bitbucket\.io$/i, service: "Bitbucket" },
  { re: /\.readthedocs\.io$/i, service: "Read the Docs" },
];

async function checkDnssec(domain: string, resolve: Resolver): Promise<CheckResult> {
  const r = await resolve(domain, "DS");
  if (recordData(r, TYPE.DS).length > 0) {
    return { check: "DNSSEC", status: "pass", detail: `DS record present${r.AD ? " (AD-validated)" : ""} — chain of trust established.`, fix: "" };
  }
  return {
    check: "DNSSEC", status: "warn",
    detail: "No DS record — DNSSEC is not enabled, so DNS answers for this domain can be spoofed.",
    fix: "Enable DNSSEC at your DNS provider AND publish the DS record at your registrar.",
  };
}

async function checkCaa(domain: string, resolve: Resolver): Promise<CheckResult> {
  const caa = recordData(await resolve(domain, "CAA"), TYPE.CAA);
  if (caa.length === 0) {
    return {
      check: "CAA", status: "warn",
      detail: "No CAA record — any certificate authority may issue a cert for this domain.",
      fix: `Add a CAA record limiting issuance, e.g. \`${domain}. CAA 0 issue "letsencrypt.org"\`.`,
    };
  }
  const issuers = caa.filter((d) => /\bissue/i.test(d)).map((d) => d.match(/"([^"]*)"/)?.[1]).filter(Boolean);
  return { check: "CAA", status: "pass", detail: `CAA present; authorized issuer(s): ${issuers.join(", ") || "(set)"}.`, fix: "" };
}

async function checkSpf(domain: string, resolve: Resolver): Promise<CheckResult> {
  const spf = txt(await resolve(domain, "TXT")).filter((t) => /^v=spf1\b/i.test(t));
  if (spf.length === 0) {
    return { check: "SPF", status: "warn", detail: "No SPF record found.", fix: "If this domain sends email, add `v=spf1 include:<provider> -all` (or `~all`)." };
  }
  if (spf.length > 1) {
    return { check: "SPF", status: "fail", critical: true, detail: `${spf.length} SPF records — RFC 7208 permits only one, so SPF is ignored entirely.`, fix: "Merge into a single `v=spf1` record." };
  }
  const m = spf[0].match(/([-~?+]?)all\b/i);
  if (!m) return { check: "SPF", status: "warn", detail: `SPF present but has no \`all\` mechanism — defaults to neutral.`, fix: "End the record with `-all` (strict) or `~all` (softfail)." };
  const qual = m[1] || "+"; // a bare `all` defaults to `+all`
  if (qual === "+") return { check: "SPF", status: "fail", critical: true, detail: "SPF ends in `+all` (or bare `all`) — anyone may send mail as this domain.", fix: "Change to `-all` (strict) or `~all` (softfail)." };
  if (qual === "?") return { check: "SPF", status: "warn", detail: "SPF ends in `?all` (neutral) — weak protection.", fix: "Use `-all` or `~all`." };
  return { check: "SPF", status: "pass", detail: `SPF present and restrictive (\`${qual}all\`).`, fix: "" };
}

async function checkDmarc(domain: string, resolve: Resolver): Promise<CheckResult> {
  const dmarc = txt(await resolve(`_dmarc.${domain}`, "TXT")).find((t) => /^v=DMARC1\b/i.test(t));
  if (!dmarc) {
    return { check: "DMARC", status: "fail", critical: true, detail: "No DMARC record — the domain is spoofable and receivers have no enforcement policy.", fix: `Add \`_dmarc.${domain} TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}"\`.` };
  }
  const p = dmarc.match(/\bp=(none|quarantine|reject)\b/i)?.[1]?.toLowerCase();
  if (p === "reject" || p === "quarantine") {
    return { check: "DMARC", status: "pass", detail: `DMARC policy p=${p}.`, fix: p === "quarantine" ? "Consider p=reject once reports look clean." : "" };
  }
  return { check: "DMARC", status: "fail", critical: true, detail: `DMARC present but p=${p ?? "none"} — not enforced, so spoofed mail is still delivered.`, fix: "Raise the policy to at least `p=quarantine`." };
}

async function checkDkim(domain: string, resolve: Resolver, selectors: string[]): Promise<CheckResult> {
  for (const sel of selectors) {
    const r = await resolve(`${sel}._domainkey.${domain}`, "TXT").catch(() => null);
    if (r && txt(r).some((t) => /v=DKIM1|(^|;)\s*p=/i.test(t))) {
      return { check: "DKIM", status: "pass", detail: `DKIM key resolves for selector "${sel}".`, fix: "" };
    }
  }
  return { check: "DKIM", status: "warn", detail: `No DKIM key found for the tried selectors (${selectors.join(", ")}).`, fix: "Publish your email provider's DKIM selector, or pass the correct selector to the checker." };
}

/** Dangling-CNAME / subdomain-takeover check for a single name. Exported for the sweep job. */
export async function checkDangling(name: string, resolve: Resolver): Promise<CheckResult> {
  const label = `Dangling CNAME (${name})`;
  const targets = recordData(await resolve(name, "CNAME"), TYPE.CNAME).map((t) => t.replace(/\.$/, ""));
  if (targets.length === 0) return { check: label, status: "pass", detail: "No CNAME (apex/A record or none) — not exposed to CNAME takeover.", fix: "" };
  for (const target of targets) {
    const svc = TAKEOVER_PATTERNS.find((p) => p.re.test(target));
    if (!svc) continue;
    const a = await resolve(target, "A").catch(() => null);
    const resolves = !!a && a.Status === 0 && (a.Answer ?? []).length > 0;
    if (!resolves) {
      return { check: label, status: "fail", critical: true, detail: `${name} → ${target} (${svc.service}) but the target does not resolve — subdomain-takeover risk.`, fix: `Remove the CNAME, or re-claim the ${svc.service} resource it points to.` };
    }
    return { check: label, status: "pass", detail: `${name} → ${target} (${svc.service}); target resolves (claimed).`, fix: "" };
  }
  return { check: label, status: "pass", detail: `${name} → ${targets.join(", ")} (not a known takeover-prone target).`, fix: "" };
}

export type VerifyOptions = { resolve?: Resolver; dkimSelectors?: string[]; subdomains?: string[] };

const DEFAULT_DKIM = ["resend", "google", "default", "selector1", "selector2", "k1", "s1", "mail"];

/** Run all DNS-security checks for `domain` and return a structured report. Never throws. */
export async function verifyDomainSecurity(domain: string, opts: VerifyOptions = {}): Promise<DomainSecurityReport> {
  const resolve = opts.resolve ?? dohResolver;
  const d = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const names = [d, ...(opts.subdomains ?? ["www"]).map((s) => `${s}.${d}`)];

  const checks = await Promise.all([
    safe(() => checkDnssec(d, resolve), "DNSSEC"),
    safe(() => checkCaa(d, resolve), "CAA"),
    safe(() => checkSpf(d, resolve), "SPF"),
    safe(() => checkDmarc(d, resolve), "DMARC"),
    safe(() => checkDkim(d, resolve, opts.dkimSelectors ?? DEFAULT_DKIM), "DKIM"),
    ...names.map((n) => safe(() => checkDangling(n, resolve), `Dangling CNAME (${n})`)),
  ]);

  return {
    domain: d,
    checks,
    summary: {
      pass: checks.filter((c) => c.status === "pass").length,
      warn: checks.filter((c) => c.status === "warn").length,
      fail: checks.filter((c) => c.status === "fail").length,
      critical: checks.filter((c) => c.critical).length,
      blockActivation: checks.some((c) => c.critical),
    },
  };
}

/** One failed lookup must never throw the whole report. */
async function safe(fn: () => Promise<CheckResult>, check: string): Promise<CheckResult> {
  try {
    return await fn();
  } catch (e) {
    return { check, status: "warn", detail: `Lookup failed: ${e instanceof Error ? e.message : "error"}.`, fix: "Retry; verify the resolver / network reachability." };
  }
}
