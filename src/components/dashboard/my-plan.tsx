"use client";

import Link from "next/link";
import { SectionHeader, Surface } from "./ui";
import { Icon } from "./icons";
import { usePlan } from "./plan-context";
import { planLabel, tierById, fmtPrice, TIERS, planRank } from "@/lib/plans";

/**
 * Profile › My Plan — shows the member's current subscription and a route into
 * the full subscription / upgrade page.
 */
export function MyPlan({ delay = 0 }: { delay?: number }) {
  const { plan } = usePlan();
  const tier = tierById(plan);
  const nextTier = TIERS.find((t) => planRank(t.id) > planRank(plan));

  return (
    <div className="rise" style={{ animationDelay: `${delay}ms` }}>
      <SectionHeader title="My Plan" />
      <Surface radius="2rem" inner="p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10 ${tier?.accent ?? "text-aerial-cyan"}`}>
              <Icon name={tier?.gem ?? "check"} size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{planLabel(plan)} member</h3>
                {tier && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/75">
                    {fmtPrice(tier.price)}/mo
                  </span>
                )}
              </div>
              <p className="mt-1 max-w-md text-sm text-white/55">
                {plan === "free"
                  ? "You're on the free plan — join, connect, book, manage payments & contracts, and deliver files."
                  : tier?.blurb}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/subscription"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-grid-black transition-transform hover:scale-[1.02]"
          >
            {plan === "free" ? "Upgrade plan" : "Manage plan"}
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-grid-black/10">
              <Icon name="arrow" size={13} />
            </span>
          </Link>
        </div>

        {plan !== "free" && tier && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-white/8 pt-5 text-xs text-white/55">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5"><Icon name="folder" size={13} className="text-white/40" /> {tier.transfer}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5"><Icon name="grid" size={13} className="text-white/40" /> {tier.storage}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5"><Icon name="shield" size={13} className="text-white/40" /> {tier.protection}</span>
          </div>
        )}

        {nextTier && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-grid-blue/20 bg-grid-blue/[0.06] px-4 py-3 text-sm text-white/70">
            <Icon name="sparkles" size={16} className="shrink-0 text-aerial-cyan" />
            <span>
              Unlock {nextTier.name} for {fmtPrice(nextTier.price)}/mo — {nextTier.features.slice(0, 3).join(", ")} and more.
            </span>
          </div>
        )}
      </Surface>
    </div>
  );
}
