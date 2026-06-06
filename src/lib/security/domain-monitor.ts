import "server-only";

/**
 * Scheduled domain monitors (run via /api/cron/domain-security):
 *  - Certificate Transparency: diff crt.sh against a stored baseline; alert on a
 *    cert from an unexpected CA or covering an unexpected name.
 *  - Dangling-record sweep: re-run the CNAME-takeover check across our domains.
 *
 * Anomalies are written to `audit_event` AND forwarded to the monitoring channel
 * (Sentry once SENTRY_DSN is set; log-only otherwise). Config + the CT baseline
 * live in `app_config` (no schema change). Single-app scope: our own domain(s).
 */
import { getConfigValue, setConfigValue } from "../config-store";
import { logAudit } from "../audit";
import { reportError } from "../monitoring";
import { checkDangling, dohResolver, type CheckResult, type Resolver } from "./domain-security";

const CFG = { domains: "monitored_domains", seen: "ct_seen_certs", cas: "ct_expected_cas", subs: "ct_allowed_subdomains" } as const;
const DEFAULT_CAS = ["Let's Encrypt", "Google Trust Services", "DigiCert", "Cloudflare", "Amazon", "Sectigo"];

/** Our monitored domain(s): app_config override, else the app URL host. */
async function monitoredDomains(): Promise<string[]> {
  const configured = await getConfigValue<string[]>(CFG.domains, []);
  if (configured.length) return configured;
  try {
    return process.env.NEXT_PUBLIC_APP_URL ? [new URL(process.env.NEXT_PUBLIC_APP_URL).host] : [];
  } catch {
    return [];
  }
}

type CtCert = { id?: number; issuer_name?: string; common_name?: string; name_value?: string };
export type CtAnomaly = { domain: string; certId: number; issuer: string; names: string[]; reason: string };

const nameAllowed = (name: string, domain: string, subs: string[]): boolean => {
  const n = name.toLowerCase().replace(/^\*\./, "");
  return n === domain || subs.some((s) => n === `${s}.${domain}`);
};

/** Diff crt.sh certs for `domain` against `seen`; the first run baselines silently. */
export async function checkCertificateTransparency(
  domain: string,
  opts: { seen: number[]; expectedCAs: string[]; allowedSubdomains: string[]; fetchImpl?: typeof fetch },
): Promise<{ anomalies: CtAnomaly[]; seen: number[]; baselined: boolean }> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`crt.sh ${domain} → HTTP ${res.status}`);
  const certs = (await res.json()) as CtCert[];

  // First run: establish a baseline without alerting on the existing backlog.
  if (opts.seen.length === 0) {
    return { anomalies: [], seen: certs.map((c) => c.id).filter((id): id is number => typeof id === "number"), baselined: true };
  }

  const anomalies: CtAnomaly[] = [];
  const seen = [...opts.seen];
  for (const c of certs) {
    if (typeof c.id !== "number" || seen.includes(c.id)) continue;
    seen.push(c.id);
    const names = (c.name_value || c.common_name || "").split("\n").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const issuer = c.issuer_name ?? "(unknown)";
    if (!opts.expectedCAs.some((ca) => issuer.toLowerCase().includes(ca.toLowerCase()))) {
      anomalies.push({ domain, certId: c.id, issuer, names, reason: `Unexpected issuer CA: ${issuer}` });
    } else {
      const badName = names.find((nm) => !nameAllowed(nm, domain, opts.allowedSubdomains));
      if (badName) anomalies.push({ domain, certId: c.id, issuer, names, reason: `Certificate covers an unexpected name: ${badName}` });
    }
  }
  return { anomalies, seen: seen.slice(-5000), baselined: false }; // cap stored ids
}

/** Dangling-CNAME sweep across names; returns only the failures. */
export async function sweepDangling(names: string[], resolve: Resolver = dohResolver): Promise<CheckResult[]> {
  const results = await Promise.all(names.map((n) => checkDangling(n, resolve).catch(() => null)));
  return results.filter((r): r is CheckResult => !!r && r.status === "fail");
}

export type MonitorResult = { domains: string[]; ctAnomalies: CtAnomaly[]; dangling: CheckResult[]; baselined: string[] };

/** The scheduled job entrypoint (called by the cron route). Never throws. */
export async function runDomainSecurityMonitor(): Promise<MonitorResult> {
  const domains = await monitoredDomains();
  const expectedCAs = await getConfigValue<string[]>(CFG.cas, DEFAULT_CAS);
  const allowedSubdomains = await getConfigValue<string[]>(CFG.subs, ["www"]);
  const out: MonitorResult = { domains, ctAnomalies: [], dangling: [], baselined: [] };

  for (const domain of domains) {
    try {
      const seenKey = `${CFG.seen}:${domain}`;
      const seen = await getConfigValue<number[]>(seenKey, []);
      const ct = await checkCertificateTransparency(domain, { seen, expectedCAs, allowedSubdomains });
      await setConfigValue(seenKey, ct.seen, { label: `CT baseline ${domain}`, category: "security" });
      if (ct.baselined) out.baselined.push(domain);
      for (const a of ct.anomalies) {
        out.ctAnomalies.push(a);
        await logAudit(null, "DOMAIN_CT_ANOMALY", a);
        await reportError(new Error(`CT anomaly for ${domain}: ${a.reason}`), { ...a });
      }
    } catch (e) {
      await reportError(e, { domain, phase: "ct" });
    }
    try {
      const names = [domain, ...allowedSubdomains.map((s) => `${s}.${domain}`)];
      const dangling = await sweepDangling(names);
      for (const d of dangling) {
        out.dangling.push(d);
        await logAudit(null, "DOMAIN_DANGLING", { detail: d.detail });
        await reportError(new Error(`Dangling record: ${d.detail}`), { check: d.check });
      }
    } catch (e) {
      await reportError(e, { domain, phase: "dangling" });
    }
  }
  return out;
}
