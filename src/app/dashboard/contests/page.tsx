"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Icon, StatusPill } from "@/components/dashboard/ui";
import { listLiveContests, type LiveContestView } from "@/lib/contest-submit-actions";

function fmt(minor: number, currency = "eur"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(minor / 100);
  } catch {
    return `€${Math.round(minor / 100)}`;
  }
}

export default function ContestsPage() {
  const [contests, setContests] = useState<LiveContestView[] | null>(null);
  useEffect(() => {
    listLiveContests().then(setContests).catch(() => setContests([]));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <PageHeader
          eyebrow="Win prizes"
          tone="gold"
          title="Contests"
          subtitle="Enter brand-backed contests — win real prizes, get discovered, and put your work in front of the brands hiring now."
        />
      </div>

      <div className="rise" style={{ animationDelay: "60ms" }}>
        {!contests ? (
          <p className="text-sm text-white/40">Loading contests…</p>
        ) : contests.length === 0 ? (
          <Card className="p-10 text-center text-sm text-white/55">No live contests right now — check back soon.</Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {contests.map((c) => {
              const deadline = c.submitCutoffAt ? new Date(c.submitCutoffAt) : null;
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/contests/${c.id}`}
                  className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-review-gold/30 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-review-gold/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-review-gold ring-1 ring-review-gold/25">
                      <Icon name="gift" size={11} /> {fmt(c.prizeAmount, c.currency)} prize
                    </span>
                    {c.mySubmitted && <StatusPill tone="escrow">Entered</StatusPill>}
                  </div>
                  <div className="mt-3 text-base font-semibold text-white">{c.title}</div>
                  <p className="mt-1 line-clamp-2 text-sm leading-snug text-white/55">{c.description || "Enter to win a share of the prize."}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/45">
                    <span className="capitalize">{c.type}</span>
                    <span>·</span>
                    <span>{c.tokenCount} prizes</span>
                    <span>·</span>
                    <span>{c.submissionCount} entries</span>
                    {deadline && (
                      <>
                        <span>·</span>
                        <span>ends {deadline.toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
