import { Reveal } from "./reveal";
import { Stagger, StaggerItem } from "./motion";
import { Cta } from "./ui";

const PLANS = [
  {
    side: "For clients",
    tone: "green" as const,
    price: "Free",
    sub: "to browse, post jobs & message",
    line: "+ 5% service fee on funded bookings",
    features: [
      "Unlimited search & shortlists",
      "Post one-off, urgent & long-term jobs",
      "Grid Escrow payment protection",
      "Digital contracts & project tracking",
      "Two-way reviews",
    ],
    cta: { label: "Hire a creative", href: "/signup" },
    highlight: false,
  },
  {
    side: "For creators",
    tone: "blue" as const,
    price: "Free",
    sub: "to join, showcase & get booked",
    line: "10% flat fee on completed bookings, paid out on time",
    features: [
      "Verified profile & portfolio",
      "Packages, day rates & bookings",
      "Apply to urgent & long-term jobs",
      "Crew collab & revenue share",
      "Academy, Shop & finance tools",
    ],
    cta: { label: "Join as a creator", href: "/signup" },
    highlight: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative px-4 py-24 sm:px-6 md:py-36">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-14 max-w-2xl">
          <h2 className="text-balance text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            Clear money. No surprises.
          </h2>
          <p className="mt-5 text-pretty text-white/55">
            Free to start on both sides. You only pay when work actually happens.
            Budgets, fees and escrow status are visible before anyone commits.
          </p>
        </Reveal>

        <Stagger className="grid gap-4 md:grid-cols-2 md:gap-6" stagger={0.14}>
          {PLANS.map((p) => (
            <StaggerItem key={p.side} className="h-full">
              <div
                className={`group relative h-full overflow-hidden rounded-[2.25rem] border p-1.5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 ${
                  p.highlight
                    ? "border-grid-blue/30 bg-grid-blue/[0.06]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {p.highlight && (
                  <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-grid-blue/20 blur-3xl" />
                )}
                <div className="relative flex h-full flex-col rounded-[calc(2.25rem-0.375rem)] bg-[radial-gradient(130%_130%_at_0%_0%,#121317_0%,#08090b_70%)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
                  <span
                    className={`text-sm font-medium ${
                      p.tone === "green" ? "text-escrow-green" : "text-aerial-cyan"
                    }`}
                  >
                    {p.side}
                  </span>
                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="text-5xl font-semibold tracking-[-0.03em] text-white">
                      {p.price}
                    </span>
                    <span className="text-sm text-white/60">{p.sub}</span>
                  </div>
                  <p className="mt-3 text-sm text-white/60">{p.line}</p>

                  <ul className="mt-8 flex flex-1 flex-col gap-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                        <Check tone={p.tone} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-9">
                    <Cta href={p.cta.href} tone={p.tone}>
                      {p.cta.label}
                    </Cta>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={120}>
          <p className="mt-8 text-center text-xs text-white/60">
            Agencies and companies booking at volume can{" "}
            <a href="#" className="text-white/70 underline-offset-4 hover:underline">
              talk to us about Grid for Teams
            </a>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Check({ tone }: { tone: "green" | "blue" }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        tone === "green" ? "bg-escrow-green/15" : "bg-grid-blue/15"
      }`}
    >
      <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M2.5 7.5L5.5 10.5L11.5 3.5"
          stroke={tone === "green" ? "#4FD07A" : "#5AA9F5"}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
