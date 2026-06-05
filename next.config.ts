import type { NextConfig } from "next";

/**
 * App-layer security headers, applied to EVERY response on our domain.
 *
 * HTTPS: Vercel already 301-redirects HTTP→HTTPS at the edge; the app's job is
 * HSTS (incl. `preload`) + `upgrade-insecure-requests`. The CSP ships in
 * REPORT-ONLY first so it can't break the locked UI — verify no violations in
 * the browser console, then rename the header to `Content-Security-Policy` to
 * enforce (and tighten script-src to nonces via the Proxy as a follow-up).
 */

// Browser origins the app legitimately reaches: Supabase REST/auth/storage +
// realtime websockets. Derived from env; falls back to the Supabase wildcard.
const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supaOrigin = supaUrl ? new URL(supaUrl).origin : "https://*.supabase.co";
const supaWss = supaUrl ? `wss://${new URL(supaUrl).host}` : "wss://*.supabase.co";

const csp = [
  "default-src 'self'", //                      deny-by-default for anything not listed below
  "base-uri 'self'", //                         block <base> tag injection
  "object-src 'none'", //                       no plugins (Flash/Java/etc.)
  "frame-ancestors 'none'", //                  not embeddable anywhere (mirrors X-Frame-Options: DENY)
  "form-action 'self'", //                      forms may only submit back to us
  `img-src 'self' data: blob: ${supaOrigin}`, // data: logos/banners, blob: previews, signed Storage URLs
  "font-src 'self' data:", //                   self-hosted + any inlined fonts
  "style-src 'self' 'unsafe-inline'", //        Tailwind + framework inline styles
  "script-src 'self' 'unsafe-inline'", //       Next.js inline bootstrap/hydration (→ nonces later)
  `connect-src 'self' ${supaOrigin} ${supaWss}`, // Supabase REST/auth/storage + realtime websockets
  "worker-src 'self' blob:", //                 web workers
  "manifest-src 'self'",
  "upgrade-insecure-requests", //               upgrade any http subresource to https
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // REPORT-ONLY first (Rule 2: must not break the locked UI). Flip the key to
  // "Content-Security-Policy" once verified to enforce.
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = {
  experimental: {
    // Shop logos/banners/covers are sent as data URLs through Server Actions.
    serverActions: { bodySizeLimit: "6mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
