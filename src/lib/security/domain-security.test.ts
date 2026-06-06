import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyDomainSecurity, type Resolver, type DohResponse } from "./domain-security.ts";

/**
 * Unit tests with MOCKED DNS — no network. Run: `node --test src/lib/security/domain-security.test.ts`
 * (Node ≥ 22.18 strips the TS types automatically.)
 */

// Build a resolver from a map keyed by "TYPE name"; anything unmapped → NXDOMAIN.
function mockResolver(map: Record<string, DohResponse>): Resolver {
  return async (name, type) => map[`${type} ${name.toLowerCase()}`] ?? { Status: 3 };
}
const rec = (type: number, data: string[]): DohResponse => ({ Status: 0, Answer: data.map((d) => ({ name: "x", type, data: d })) });
const TXT = (data: string[]) => rec(16, data.map((d) => `"${d}"`)); // DoH returns TXT data quoted

test("a well-configured domain passes every check", async () => {
  const resolve = mockResolver({
    "DS example.com": rec(43, ["12345 13 2 abcd"]),
    "CAA example.com": rec(257, ['0 issue "letsencrypt.org"']),
    "TXT example.com": TXT(["v=spf1 include:resend.com -all"]),
    "TXT _dmarc.example.com": TXT(["v=DMARC1; p=reject; rua=mailto:d@example.com"]),
    "TXT resend._domainkey.example.com": TXT(["v=DKIM1; k=rsa; p=MIGfMA0..."]),
    "CNAME example.com": { Status: 0 },
    "CNAME www.example.com": { Status: 0 },
  });
  const report = await verifyDomainSecurity("example.com", { resolve });
  const status = Object.fromEntries(report.checks.map((c) => [c.check, c.status]));
  assert.equal(status["DNSSEC"], "pass");
  assert.equal(status["CAA"], "pass");
  assert.equal(status["SPF"], "pass");
  assert.equal(status["DMARC"], "pass");
  assert.equal(status["DKIM"], "pass");
  assert.equal(report.summary.blockActivation, false);
  assert.equal(report.summary.critical, 0);
});

test("an insecure domain flags critical issues and blocks activation", async () => {
  const resolve = mockResolver({
    // no DS, no CAA, no DMARC, no DKIM
    "TXT example.com": TXT(["v=spf1 +all"]), // overly permissive
    "CNAME app.example.com": rec(5, ["unclaimed.vercel.app"]), // points at Vercel…
    "A unclaimed.vercel.app": { Status: 3 }, // …which does not resolve → takeover risk
  });
  const report = await verifyDomainSecurity("example.com", { resolve, subdomains: ["app"] });
  const get = (c: string) => report.checks.find((x) => x.check === c)!;
  assert.equal(get("DNSSEC").status, "warn");
  assert.equal(get("CAA").status, "warn");
  assert.equal(get("SPF").status, "fail");
  assert.equal(get("SPF").critical, true);
  assert.equal(get("DMARC").status, "fail");
  assert.equal(get("DMARC").critical, true);
  assert.equal(get("DKIM").status, "warn");
  const dangling = report.checks.find((c) => c.check.startsWith("Dangling CNAME (app."))!;
  assert.equal(dangling.status, "fail");
  assert.equal(dangling.critical, true);
  assert.equal(report.summary.blockActivation, true);
  assert.ok(report.summary.critical >= 3);
});

test("SPF ~all is acceptable; DMARC p=none does not meet the minimum", async () => {
  const resolve = mockResolver({
    "TXT example.com": TXT(["v=spf1 ~all"]),
    "TXT _dmarc.example.com": TXT(["v=DMARC1; p=none"]),
  });
  const report = await verifyDomainSecurity("example.com", { resolve, subdomains: [] });
  assert.equal(report.checks.find((c) => c.check === "SPF")!.status, "pass");
  const dmarc = report.checks.find((c) => c.check === "DMARC")!;
  assert.equal(dmarc.status, "fail");
  assert.equal(dmarc.critical, true);
});

test("a claimed CNAME target (resolves) is not flagged as dangling", async () => {
  const resolve = mockResolver({
    "CNAME www.example.com": rec(5, ["live.vercel.app"]),
    "A live.vercel.app": rec(1, ["76.76.21.21"]),
  });
  const report = await verifyDomainSecurity("example.com", { resolve, subdomains: ["www"] });
  const dangling = report.checks.find((c) => c.check === "Dangling CNAME (www.example.com)")!;
  assert.equal(dangling.status, "pass");
});
