// k6 load test — public surfaces (no auth). Stress the marketing/waitlist path
// the way real launch traffic hits it, before users do.
//
// Run:  k6 run -e BASE_URL=https://your-deploy.example loadtest/browse.js
// Local: k6 run -e BASE_URL=http://localhost:3000 loadtest/browse.js
//
// Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  // Ramp to 50 virtual users, hold, ramp down. Tune for your launch estimate.
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // <1% errors
    http_req_duration: ["p(95)<800"], // 95% of requests under 800ms
  },
};

export default function () {
  // 1) Landing page.
  const home = http.get(`${BASE_URL}/`);
  check(home, { "home 200": (r) => r.status === 200 });

  // 2) Waitlist page (the public launch surface).
  const waitlist = http.get(`${BASE_URL}/waitlist`);
  check(waitlist, { "waitlist 200": (r) => r.status === 200 });

  // 3) Trust center (static, cacheable).
  const trust = http.get(`${BASE_URL}/trust`);
  check(trust, { "trust 200": (r) => r.status === 200 });

  sleep(Math.random() * 2 + 1); // think-time 1–3s
}
