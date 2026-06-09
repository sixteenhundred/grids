"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader, Card, Button, Icon, StatusPill } from "@/components/dashboard/ui";
import { useSheet } from "@/components/dashboard/sheet";
import { ContestSubmitSheet } from "@/components/dashboard/contest-submit-sheet";
import { getContestSubmitContext, type SubmitContext } from "@/lib/contest-submit-actions";

function fmt(minor: number, currency = "eur"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(minor / 100);
  } catch {
    return `€${Math.round(minor / 100)}`;
  }
}

const SUB_TONE = { submitted: "blue", winner: "escrow", purchased: "gold" } as const;

export default function ContestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { open } = useSheet();
  const [ctx, setCtx] = useState<SubmitContext | null>(null);

  async function load() {
    try {
      setCtx(await getContestSubmitContext(id));
    } catch {
      setCtx({ contest: null, profile: { name: "", hasAvatar: false, hasCountry: false, country: "" }, mySubmissions: [], open: false });
    }
  }
  useEffect(() => {
    if (id) void load();
  }, [id]);

  if (!ctx) return <p className="text-sm text-white/40">Loading…</p>;
  if (!ctx.contest) return <Card className="p-10 text-center text-sm text-white/55">Contest not found.</Card>;
  const C = ctx.contest;
  const deadline = C.submitCutoffAt ? new Date(C.submitCutoffAt) : null;
  const pick = C.winnerPickAt ? new Date(C.winnerPickAt) : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="rise">
        <PageHeader eyebrow={`${fmt(C.prizeAmount, C.currency)} prize`} tone="gold" title={C.title} subtitle={C.description || undefined} />
      </div>

      {/* Prize tokens */}
      <div className="rise" style={{ animationDelay: "60ms" }}>
        <Card className="p-5 sm:p-6">
          <div className="text-sm font-semibold text-white">Prize tokens</div>
          <div className="mt-3 flex flex-col gap-2">
            {C.tokens.map((t, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-2.5">
                <span className="text-sm text-white/75">{t.label || `Prize ${i + 1}`}</span>
                <span className="font-mono text-sm font-semibold text-review-gold">{fmt(t.amount, C.currency)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
            <span className="capitalize">Type: {C.type}</span>
            {deadline && <span>Submit by {deadline.toLocaleString()}</span>}
            {pick && <span>Winners {pick.toLocaleDateString()}</span>}
          </div>
        </Card>
      </div>

      {/* Submit */}
      <div className="rise" style={{ animationDelay: "120ms" }}>
        {ctx.open ? (
          <Button tone="gold" arrow onClick={() => open(<ContestSubmitSheet contestId={id} onSubmitted={load} />)}>
            Submit entry
          </Button>
        ) : (
          <Card className="p-5 text-center text-sm text-white/55">Submissions are closed for this contest.</Card>
        )}
      </div>

      {/* My entries */}
      {ctx.mySubmissions.length > 0 && (
        <div className="rise" style={{ animationDelay: "160ms" }}>
          <div className="mb-3 text-sm font-semibold text-white">Your entries</div>
          <div className="flex flex-col gap-2">
            {ctx.mySubmissions.map((s) => (
              <Card key={s.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-review-gold/12 text-review-gold ring-1 ring-review-gold/25">
                    <Icon name="lock" size={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{s.title}</div>
                    {s.addToPortfolio && <div className="text-xs text-white/40">Auto-publishes to your portfolio after the contest</div>}
                  </div>
                </div>
                <StatusPill tone={SUB_TONE[s.status as keyof typeof SUB_TONE] ?? "blue"}>{s.status}</StatusPill>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Privacy note */}
      <p className="rise flex items-start gap-2 text-xs leading-relaxed text-white/40" style={{ animationDelay: "200ms" }}>
        <Icon name="lock" size={13} className="mt-0.5 shrink-0 text-escrow-green" />
        Submissions stay private previews. Ownership and usage rights transfer only when the host redeems a prize token to purchase a specific work.
      </p>
    </div>
  );
}
