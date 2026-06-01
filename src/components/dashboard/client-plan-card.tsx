"use client";

import Link from "next/link";
import { Icon } from "./icons";
import type { ClientTier } from "@/lib/client-plans";

/**
 * Premium client subscription card. Enterprise renders as the visually
 * dominant flagship (highlight). CTAs are wired by the parent: "start" links
 * to the workspace, "agency"/"enterprise" open the contact sheet.
 */
export function ClientPlanCard({
  tier,
  onContact,
}: {
  tier: ClientTier;
  onContact: (tier: ClientTier) => void;
}) {
  const cta = tier.cta;
  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-[2rem] border p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 ${tier.ring} ${
        tier.highlight ? "bg-grid-blue/[0.07] shadow-[0_30px_90px_-40px] shadow-grid-blue/50" : "bg-white/[0.03]"
      }`}
    >
      <div className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl ${tier.glow}`} />
      <div className="relative flex h-full flex-col rounded-[calc(2rem-0.375rem)] bg-[radial-gradient(130%_130%_at_0%_0%,#101a26_0%,#070b10_72%)] p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
        {tier.badge && (
          <span className="absolute right-6 top-6 rounded-full bg-grid-blue/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-aerial-cyan">
            {tier.badge}
          </span>
        )}

        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10 ${tier.accent}`}>
          <Icon name={tier.gem} size={24} />
        </span>

        <h3 className="mt-5 text-xl font-semibold tracking-tight text-white">{tier.name}</h3>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-4xl font-semibold tracking-[-0.03em] text-white">{tier.priceLabel}</span>
          {tier.cadence && <span className="text-sm text-white/50">{tier.cadence}</span>}
        </div>

        <p className="mt-3 text-sm font-medium text-white/80">{tier.positioning}</p>
        <p className="mt-2 text-sm leading-relaxed text-white/50">{tier.description}</p>

        {tier.inheritsFrom && (
          <div className="mt-6 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">{tier.inheritsFrom}</div>
        )}
        <ul className={`flex flex-1 flex-col gap-2.5 ${tier.inheritsFrom ? "mt-3" : "mt-6"}`}>
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-white/75">
              <Icon name="check" size={15} className={`mt-0.5 shrink-0 ${tier.accent}`} /> {f}
            </li>
          ))}
        </ul>

        {tier.excludes && tier.excludes.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2 border-t border-white/8 pt-4">
            {tier.excludes.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-white/35">
                <Icon name="lock" size={14} className="mt-0.5 shrink-0 text-white/30" /> {f}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-7">
          {cta.kind === "start" ? (
            <Link
              href={cta.href ?? "/dashboard"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.1]"
            >
              {cta.label}
            </Link>
          ) : (
            <button
              onClick={() => onContact(tier)}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] ${
                tier.highlight ? "bg-white text-grid-black" : "bg-client-green text-on-accent"
              }`}
            >
              {cta.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
