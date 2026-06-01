"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { PageHeader, Surface } from "@/components/dashboard/ui";
import { Icon } from "@/components/dashboard/icons";
import { OperationBackground } from "@/components/dashboard/operation-bg";
import { usePlan } from "@/components/dashboard/plan-context";
import {
  TIERS,
  FREE_INCLUDES,
  GATED_FEATURES,
  QUOTES,
  TRIAL_CREDITS,
  fmtPrice,
  planRank,
  planLabel,
  tierById,
  type PlanId,
} from "@/lib/plans";

/** Same ocean palette as the landing — the hue pulses blue → pink → blue. */
const OCEAN = ["#22d3ee", "#0ea5e9", "#3b82f6", "#6366f1", "#1e3a8a"];

/* -------------------------------------------------------------------------- */

function RotatingQuote() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % QUOTES.length), 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex min-h-[5rem] items-center justify-center px-6 text-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 6, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6, filter: "blur(8px)" }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="max-w-2xl text-balance text-xl font-light leading-snug tracking-tight text-white/85 sm:text-3xl"
        >
          {QUOTES[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function PlanButton({
  tierId,
  current,
  onUpgrade,
}: {
  tierId: PlanId;
  current: PlanId;
  onUpgrade: () => void;
}) {
  const diff = planRank(tierId) - planRank(current);
  if (diff === 0)
    return (
      <span className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white/80">
        <Icon name="check" size={16} className="text-aerial-cyan" /> Current plan
      </span>
    );
  if (diff < 0)
    return (
      <button
        onClick={onUpgrade}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.07]"
      >
        Switch to this plan
      </button>
    );
  return (
    <button
      onClick={onUpgrade}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-grid-black transition-transform hover:scale-[1.02]"
    >
      Upgrade
    </button>
  );
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { ready, plan, setPlan, hasAccess, startTrial } = usePlan();
  const tier = tierById(plan);

  const tryFeature = (key: string, route: string) => {
    startTrial(key);
    router.push(route);
  };

  return (
    <>
      {/* blue ↔ pink pulsating background, same as the landing */}
      <OperationBackground on colors={OCEAN} pulse />

      <div className="flex flex-col gap-9">
        {/* Title + undertext */}
        <div className="rise">
          <PageHeader
            eyebrow="Membership"
            title="Build without limits"
            subtitle="The core of Grid is free forever. Upgrade to unlock the create-&-earn suite, bigger transfers and more protection."
          />
        </div>

        {/* MY PLAN — glass box */}
        <div className="rise" style={{ animationDelay: "40ms" }}>
          <Surface radius="2rem" inner="p-6 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10 ${tier?.accent ?? "text-aerial-cyan"}`}>
                  <Icon name={tier?.gem ?? "check"} size={22} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">My plan</span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white">{planLabel(plan)}</span>
                  </div>
                  <p className="mt-2 max-w-md text-sm text-white/55">
                    {plan === "free"
                      ? "Free always includes the essentials below. Upgrade any time — cancel any time."
                      : tier?.blurb}
                  </p>
                </div>
              </div>
              {plan !== "free" && (
                <button
                  onClick={() => setPlan("free")}
                  className="self-start rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/65 transition-colors hover:bg-white/[0.07]"
                >
                  Downgrade to Free
                </button>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {FREE_INCLUDES.map((f) => (
                <span key={f} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/65">
                  <Icon name="check" size={13} className="text-escrow-green" /> {f}
                </span>
              ))}
            </div>
          </Surface>
        </div>

        {/* Tier cards */}
        <div className="rise grid gap-4 lg:grid-cols-3" style={{ animationDelay: "80ms" }}>
          {TIERS.map((t) => {
            const isCurrent = plan === t.id;
            return (
              <div
                key={t.id}
                className={`relative h-full overflow-hidden rounded-[2rem] border p-1.5 transition-all duration-500 hover:-translate-y-1 ${t.ring} ${t.highlight ? "bg-grid-blue/[0.06]" : "bg-white/[0.03]"}`}
              >
                <div className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl ${t.glow}`} />
                <div className="relative flex h-full flex-col rounded-[calc(2rem-0.375rem)] bg-[radial-gradient(130%_130%_at_0%_0%,#121317_0%,#08090b_70%)] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
                  {t.highlight && (
                    <span className="absolute right-5 top-5 rounded-full bg-grid-blue/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-aerial-cyan">
                      Most popular
                    </span>
                  )}
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10 ${t.accent}`}>
                    <Icon name={t.gem} size={22} />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-white">{t.name}</h3>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold tracking-tight text-white">{fmtPrice(t.price)}</span>
                    <span className="text-sm text-white/50">/ month</span>
                  </div>
                  <p className="mt-3 text-sm text-white/55">{t.blurb}</p>

                  <div className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">{t.inheritsFrom}</div>
                  <ul className="mt-3 flex flex-1 flex-col gap-2.5">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-white/75">
                        <Icon name="check" size={15} className={`mt-0.5 shrink-0 ${t.accent}`} /> {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex flex-col gap-1.5 border-t border-white/8 pt-4 text-xs text-white/55">
                    <span className="flex items-center gap-2"><Icon name="folder" size={13} className="text-white/40" /> {t.transfer}</span>
                    <span className="flex items-center gap-2"><Icon name="grid" size={13} className="text-white/40" /> {t.storage}</span>
                    <span className="flex items-center gap-2"><Icon name="shield" size={13} className="text-white/40" /> {t.protection}</span>
                  </div>

                  <div className="mt-6">
                    <PlanButton tierId={t.id} current={plan} onUpgrade={() => setPlan(t.id)} />
                    {isCurrent && <p className="mt-2 text-center text-[10px] text-white/35">Demo — no card required</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="rise -mt-3 text-center text-xs text-white/45" style={{ animationDelay: "100ms" }}>
          Switching plans here is a demo — no payment is taken.
        </p>

        {/* Motivational quote — clean, no box, fades in and out */}
        <div className="rise py-4" style={{ animationDelay: "120ms" }}>
          <RotatingQuote />
        </div>

        {/* Try features */}
        <div className="rise" style={{ animationDelay: "160ms" }}>
          <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-white/40">Try before you buy</div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Feel every feature first</h2>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            Each locked feature comes with {TRIAL_CREDITS} free previews so you can experience it before upgrading.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GATED_FEATURES.map((f) => {
              const owned = ready && hasAccess(f.key);
              const ft = tierById(f.plan);
              return (
                <div
                  key={f.key}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-4 backdrop-blur-sm"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10 ${ft?.accent ?? "text-white/70"}`}>
                    <Icon name={f.icon} size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-white">{f.label}</span>
                      <span className="shrink-0 rounded-full bg-white/8 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/50">{ft?.name}</span>
                    </div>
                    <p className="truncate text-xs text-white/50">{f.blurb}</p>
                  </div>
                  {owned ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-escrow-green">
                      <Icon name="check" size={14} /> Included
                    </span>
                  ) : (
                    <button
                      onClick={() => tryFeature(f.key, f.route)}
                      className="shrink-0 rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/[0.1]"
                    >
                      Try
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
