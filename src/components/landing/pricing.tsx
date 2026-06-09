import { Reveal } from "./reveal";
import { Stagger, StaggerItem } from "./motion";
import { Cta } from "./ui";
import { TIERS, FREE_INCLUDES, fmtPrice } from "@/lib/plans";

export function Pricing() {
  return (
    <section id="pricing" className="relative px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-12 max-w-2xl">
          <h2 className="text-balance text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            Clear money. No surprises.
          </h2>
          <p className="mt-5 text-pretty text-white/55">
            The core of Grid is free, forever — join, connect, book, manage
            payments and contracts, and deliver files. Memberships unlock the
            create-&-earn suite, bigger transfers and more protection.
          </p>
        </Reveal>

        {/* Free core */}
        <Reveal>
          <div className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.03] p-1.5">
            <div className="rounded-[calc(2.25rem-0.375rem)] bg-[radial-gradient(130%_130%_at_0%_0%,#121317_0%,#08090b_70%)] p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] sm:p-8">
              <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                <div className="lg:max-w-sm">
                  <span className="text-sm font-medium text-aerial-cyan">Free, forever</span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-5xl font-semibold tracking-[-0.03em] text-white">Free</span>
                    <span className="text-sm text-white/60">to join, connect &amp; deliver</span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-white/55">
                    You only pay a service fee when work actually happens —
                    <span className="text-white/75"> 5% for clients on funded bookings</span>,
                    <span className="text-white/75"> 10% flat for creators on completed bookings</span>.
                    Payment protection, contracts and delivery are always included.
                  </p>
                </div>
                <ul className="grid flex-1 gap-3 sm:grid-cols-2">
                  {FREE_INCLUDES.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-white/75">
                      <Check />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Membership tiers */}
        <div className="mb-3 mt-6 flex items-center gap-3">
          <span className="text-sm font-medium text-white/70">Memberships</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <Stagger className="grid gap-4 md:grid-cols-3 md:gap-5" stagger={0.12}>
          {TIERS.map((t) => (
            <StaggerItem key={t.id} className="h-full">
              <div
                className={`group relative h-full overflow-hidden rounded-[2rem] border p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 ${t.ring} ${t.highlight ? "bg-grid-blue/[0.06]" : "bg-white/[0.03]"}`}
              >
                <div className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl ${t.glow}`} />
                <div className="relative flex h-full flex-col rounded-[calc(2rem-0.375rem)] bg-[radial-gradient(130%_130%_at_0%_0%,#121317_0%,#08090b_70%)] p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
                  {t.highlight && (
                    <span className="absolute right-6 top-6 rounded-full bg-grid-blue/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-aerial-cyan">
                      Most popular
                    </span>
                  )}
                  <span className={`text-sm font-medium ${t.accent}`}>{t.name}</span>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold tracking-[-0.03em] text-white">{fmtPrice(t.price)}</span>
                    <span className="text-sm text-white/55">/ mo</span>
                  </div>
                  <p className="mt-3 text-sm text-white/55">{t.blurb}</p>

                  <div className="mt-6 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">{t.inheritsFrom}</div>
                  <ul className="mt-3 flex flex-1 flex-col gap-2.5">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-white/75">
                        <Check />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex flex-col gap-1.5 border-t border-white/8 pt-4 text-xs text-white/55">
                    <span>{t.transfer}</span>
                    <span>{t.storage}</span>
                    <span>{t.protection}</span>
                  </div>

                  <div className="mt-6">
                    <Cta href="/signup" tone={t.highlight ? "blue" : "white"}>
                      Get {t.name}
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
            <a href="/signup" className="text-white/70 underline-offset-4 hover:underline">
              talk to us about Grid for Teams
            </a>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Check() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-grid-blue/15">
      <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M2.5 7.5L5.5 10.5L11.5 3.5"
          stroke="#5AA9F5"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
