import Link from "next/link";
import { Reveal } from "./reveal";
import { Cta } from "./ui";
import { ProfileRain } from "./profile-rain";

const FOOTER = {
  Marketplace: ["Browse talent", "Categories", "Job board", "Urgent calls", "Radar"],
  Creators: ["Join as a creator", "Academy", "Shop", "Collab", "Finance"],
  Company: ["About", "Trust & safety", "Grid protection", "Pricing", "Contact"],
};

// Every footer link resolves to a real section, signup, or the legal page.
const LINK_MAP: Record<string, string> = {
  "Browse talent": "#talent",
  Categories: "#talent",
  "Job board": "#jobs",
  "Urgent calls": "#jobs",
  Radar: "/signup",
  "Join as a creator": "/signup",
  Academy: "/signup",
  Shop: "/signup",
  Collab: "/signup",
  Finance: "/signup",
  About: "/signup",
  "Trust & safety": "/trust",
  "Grid protection": "#escrow",
  Pricing: "#pricing",
  Contact: "/signup",
};
const hrefFor = (label: string) => LINK_MAP[label] ?? "/signup";

/** The "Book visual talent with confidence" CTA box, with a falling profile-picture
 *  rain behind the headline. Stands on its own so it can sit mid-page. */
export function CtaPanel() {
  return (
    <section className="relative px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.025] p-1.5">
            <div className="relative overflow-hidden rounded-[calc(2.5rem-0.375rem)] bg-[radial-gradient(130%_160%_at_50%_-20%,#0a2a52_0%,#070b14_55%,#050506_100%)] px-6 py-20 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] sm:px-12 md:py-28">
              <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-grid-blue/25 blur-[100px]" />
              {/* falling profile pictures, behind the copy */}
              <ProfileRain />
              <p className="relative font-mono text-[11px] uppercase tracking-[0.3em] text-white/60">
                Get it shot
              </p>
              <h2 className="relative mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-white sm:text-6xl">
                Book visual talent with confidence.
              </h2>
              <p className="relative mx-auto mt-6 max-w-xl text-pretty text-white/55">
                Verified creatives. Secure bookings. Stunning work. Start free,
                whether you’re hiring or getting booked.
              </p>
              <div className="relative mt-10 flex flex-wrap items-center justify-center gap-3">
                <Cta href="/signup" tone="blue">
                  Hire a creative
                </Cta>
                <Cta href="/signup" variant="ghost">
                  Join as a creator
                </Cta>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Footer links + legal — always sits at the very bottom of the page. */
export function SiteFooter() {
  return (
    <footer className="relative px-4 pb-10 pt-12 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link href="#top" className="text-2xl font-semibold tracking-tight text-white">
              Grid<span className="text-grid-blue">.</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-white/60">
              The booking layer for modern visual production. Creatives, on demand.
            </p>
          </div>
          {Object.entries(FOOTER).map(([group, items]) => (
            <div key={group}>
              <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-white/55">
                {group}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <Link
                      href={hrefFor(item)}
                      className="text-sm text-white/60 transition-colors duration-300 hover:text-white"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-7 sm:flex-row">
          <span className="text-xs text-white/55">
            © {2026} Grid. All rights reserved.
          </span>
          <div className="flex items-center gap-5 text-xs text-white/60">
            <Link href="/trust" className="transition-colors hover:text-white">Trust Center</Link>
            <Link href="/trust/privacy" className="transition-colors hover:text-white">Privacy</Link>
            <Link href="/trust/legal/terms" className="transition-colors hover:text-white">Terms</Link>
            <Link href="/trust/payments/escrow" className="transition-colors hover:text-white">Payment protection</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
