"use client";

import { motion } from "motion/react";
import { Reveal } from "./reveal";
import { AnimatedNumber, EASE_GRID, Stagger, StaggerItem } from "./motion";
import { Cta, Eyebrow } from "./ui";

const FLOW = [
  {
    label: "Funded",
    desc: "Client funds the booking before work starts.",
    state: "done" as const,
    meta: "Today, 09:41",
  },
  {
    label: "In production",
    desc: "Funds held securely while the project runs.",
    state: "active" as const,
    meta: "Now",
  },
  {
    label: "Released on approval",
    desc: "Payment released the moment work is approved.",
    state: "idle" as const,
    meta: "On delivery",
  },
];

const GUARANTEES = [
  "Signed digital contract before funding",
  "Milestone-based release, not upfront",
  "Dispute support on both sides",
];

export function Escrow() {
  return (
    <section id="escrow" className="relative px-4 py-24 sm:px-6 md:py-36">
      {/* protected-green ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aerial-cyan/[0.07] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.025] p-1.5">
          <div className="rounded-[calc(2.5rem-0.375rem)] bg-[radial-gradient(120%_140%_at_50%_0%,#0e1411_0%,#08090b_60%)] px-6 py-14 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] sm:px-12 md:py-20">
            <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              {/* Left — narrative + guarantees */}
              <Reveal>
                <Eyebrow tone="green">Grid protection</Eyebrow>
                <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                  Protected from brief to delivery.
                </h2>
                <p className="mt-5 max-w-lg text-pretty text-white/70">
                  Grid holds funds securely before work starts and releases
                  payment after approval. Clients get confidence. Creatives get
                  paid. No chasing, no risk on either side.
                </p>

                <ul className="mt-8 flex flex-col gap-3">
                  {GUARANTEES.map((g) => (
                    <li key={g} className="flex items-center gap-3 text-sm text-white/80">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-aerial-cyan/18 ring-1 ring-aerial-cyan/30">
                        <Check className="text-aerial-cyan" />
                      </span>
                      {g}
                    </li>
                  ))}
                </ul>

                <div className="mt-9">
                  <Cta href="/signup" tone="green">
                    Start a protected booking
                  </Cta>
                </div>
              </Reveal>

              {/* Right — live escrow panel */}
              <Reveal delay={120}>
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-1.5">
                  <div className="rounded-[calc(2rem-0.375rem)] bg-[radial-gradient(130%_130%_at_0%_0%,#0f1613_0%,#0a0c0e_70%)] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.07)] sm:p-7">
                    {/* panel header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-aerial-cyan/15 ring-1 ring-aerial-cyan/30">
                          <Shield className="text-aerial-cyan" />
                        </span>
                        <div className="leading-tight">
                          <div className="text-sm font-semibold text-white">
                            Hotel launch shoot
                          </div>
                          <div className="text-xs text-white/60">
                            Protected payment · contract #GR-2049
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-aerial-cyan/12 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-aerial-cyan ring-1 ring-aerial-cyan/25">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aerial-cyan/70" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-aerial-cyan" />
                        </span>
                        Live
                      </span>
                    </div>

                    {/* timeline */}
                    <div className="relative mt-7">
                      {/* spine: static track + animated fill */}
                      <span className="absolute left-[19px] top-3 bottom-9 w-px bg-white/12" />
                      <motion.span
                        className="absolute left-[19px] top-3 w-px origin-top bg-gradient-to-b from-aerial-cyan via-aerial-cyan/70 to-aerial-cyan/0"
                        style={{ height: "calc(100% - 3rem)" }}
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 1.4, ease: EASE_GRID, delay: 0.3 }}
                      />

                      <Stagger className="relative flex flex-col" stagger={0.18} delayChildren={0.25}>
                        {FLOW.map((step, i) => (
                          <StaggerItem
                            key={step.label}
                            className="relative flex items-start gap-4 pb-7 last:pb-0"
                          >
                            <span className="relative z-10 mt-px">
                              <span
                                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                  step.state === "done"
                                    ? "bg-aerial-cyan text-[#06140c]"
                                    : step.state === "active"
                                      ? "bg-[#0a0c0e] text-aerial-cyan ring-1 ring-aerial-cyan/50"
                                      : "bg-[#0a0c0e] text-white/65 ring-1 ring-white/15"
                                }`}
                              >
                                {step.state === "done" ? <Check /> : i + 1}
                              </span>
                              {step.state === "active" && (
                                <span
                                  className="absolute inset-0 rounded-full ring-1 ring-aerial-cyan/60"
                                  style={{ animation: "grid-pulse 2.4s ease-in-out infinite" }}
                                />
                              )}
                            </span>
                            <div className="flex-1 pt-1.5">
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-medium text-white">
                                  {step.label}
                                </span>
                                {step.state === "active" ? (
                                  <span className="rounded-full bg-aerial-cyan/12 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-aerial-cyan ring-1 ring-aerial-cyan/25">
                                    Held safely
                                  </span>
                                ) : (
                                  <span className="font-mono text-[11px] text-white/55">
                                    {step.meta}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-white/65">{step.desc}</p>
                            </div>
                          </StaggerItem>
                        ))}
                      </Stagger>
                    </div>

                    {/* footer total */}
                    <div className="mt-2 flex items-center justify-between rounded-[1.25rem] border border-aerial-cyan/25 bg-aerial-cyan/[0.08] px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <Lock className="text-aerial-cyan" />
                        <span className="text-sm text-white/80">Held securely</span>
                      </div>
                      <span className="font-mono text-base font-semibold text-aerial-cyan">
                        <AnimatedNumber value={3600} prefix="€" />
                      </span>
                    </div>

                    <p className="mt-4 text-center text-[11px] text-white/55">
                      Funds held by a regulated payment partner until you approve.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Check({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M2.5 7.5L5.5 10.5L11.5 3.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Shield({ className = "" }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M7 1l4.5 1.7v3.6c0 3-2 5-4.5 6-2.5-1-4.5-3-4.5-6V2.7L7 1z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M5 7l1.4 1.4L9 5.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Lock({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M3.5 6V4.5a3.5 3.5 0 017 0V6M2.8 6h8.4v6H2.8z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
