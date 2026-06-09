"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, Button, Icon, StatusPill } from "./ui";
import type { Accent } from "@/lib/grid-data";
import {
  CONTEST_TERMS,
  defaultPercentages,
  splitFromPercentages,
  DEFAULT_TOKEN_LABELS,
  type ContestType,
  type ContestView,
  type FundingSource,
} from "@/lib/contest";
import {
  listContests,
  createContest,
  updateContestStatus,
  deleteContest,
  promoteContest,
} from "@/lib/contest-actions";
import { pinToHome, unpinFromHome, pinnedKeys } from "@/lib/pin-actions";

function fmt(minor: number, currency = "eur"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(minor / 100);
  } catch {
    return `€${(minor / 100).toFixed(2)}`;
  }
}

const STATUS_TONE: Record<string, Accent> = {
  draft: "blue",
  pending_funding: "gold",
  live: "escrow",
  closed: "purple",
  finalized: "escrow",
  canceled: "red",
};

const field =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-review-gold/50";
const label = "mb-1.5 block text-xs uppercase tracking-[0.14em] text-white/45";

export function ContestAdmin() {
  const [contests, setContests] = useState<ContestView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [pinned, setPinned] = useState<Set<string>>(new Set());

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ContestType>("video");
  const [funding, setFunding] = useState<FundingSource>("grid");
  const [prizeEur, setPrizeEur] = useState<number>(0);
  const [cutoff, setCutoff] = useState("");
  const [winnerPick, setWinnerPick] = useState("");
  const [pcts, setPcts] = useState<number[]>(defaultPercentages(3));
  const [labels, setLabels] = useState<string[]>(DEFAULT_TOKEN_LABELS.slice(0, 3));
  const [showTerms, setShowTerms] = useState(false);

  const prizeMinor = Math.max(0, Math.round((Number(prizeEur) || 0) * 100));
  const sumPct = pcts.reduce((s, p) => s + (Number(p) || 0), 0);
  const splitValid = Math.abs(sumPct - 100) < 0.5;
  const amounts = splitFromPercentages(prizeMinor, pcts);
  const canSubmit = title.trim().length > 0 && prizeMinor > 0 && splitValid && !pending;

  async function load() {
    try {
      const [cs, pk] = await Promise.all([listContests(), pinnedKeys()]);
      setContests(cs);
      setPinned(new Set(pk));
    } catch {
      setError("Couldn't load contests — admin access required.");
    }
  }
  useEffect(() => {
    void load();
  }, []);

  function setCount(n: number) {
    const count = Math.max(1, Math.min(6, Math.round(n) || 1));
    setPcts(defaultPercentages(count));
    setLabels(Array.from({ length: count }, (_, i) => DEFAULT_TOKEN_LABELS[i] ?? `Prize ${i + 1}`));
  }
  function setPct(i: number, val: number) {
    setPcts((p) => p.map((x, j) => (j === i ? val : x)));
  }
  function setEur(i: number, eur: number) {
    if (prizeMinor <= 0) return;
    const pct = Math.max(0, (Math.round((Number(eur) || 0) * 100) / prizeMinor) * 100);
    setPct(i, Math.round(pct * 100) / 100);
  }
  function setLabelAt(i: number, val: string) {
    setLabels((l) => l.map((x, j) => (j === i ? val : x)));
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setType("video");
    setFunding("grid");
    setPrizeEur(0);
    setCutoff("");
    setWinnerPick("");
    setCount(3);
  }

  function submit() {
    setError(null);
    start(async () => {
      try {
        await createContest({
          title,
          description,
          type,
          fundingSource: funding,
          prizeAmount: prizeMinor,
          currency: "eur",
          submitCutoffAt: cutoff || null,
          winnerPickAt: winnerPick || null,
          tokens: labels.map((l, i) => ({ label: l, amount: amounts[i] ?? 0 })),
        });
        resetForm();
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't create contest.");
      }
    });
  }

  function act(fn: () => Promise<void>) {
    setError(null);
    start(async () => {
      try {
        await fn();
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed.");
      }
    });
  }

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-2">
        <Icon name="gift" size={18} className="text-review-gold" />
        <h2 className="text-lg font-semibold tracking-tight text-white">Contests</h2>
      </div>

      {/* Create contest */}
      <Card className="p-5 sm:p-6">
        <div className="text-sm font-semibold text-white">Create contest</div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Title</label>
            <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Summer Reels Challenge" />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Description</label>
            <textarea className={`${field} min-h-[72px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What should creators make?" />
          </div>

          <div>
            <label className={label}>Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["video", "image"] as ContestType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-2xl border px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                    type === t ? "border-review-gold/50 bg-review-gold/[0.08] text-white" : "border-white/10 bg-white/[0.02] text-white/55 hover:text-white"
                  }`}
                >
                  {t === "video" ? "Video · 4K ≤2min" : "Image · ≤5GB"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={label}>Funding source</label>
            <div className="grid grid-cols-2 gap-2">
              {(["grid", "brand"] as FundingSource[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFunding(f)}
                  className={`rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                    funding === f ? "border-review-gold/50 bg-review-gold/[0.08] text-white" : "border-white/10 bg-white/[0.02] text-white/55 hover:text-white"
                  }`}
                >
                  {f === "grid" ? "GRID-funded" : "Brand-funded"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={label}>Prize amount (€)</label>
            <input type="number" min={0} className={field} value={prizeEur || ""} onChange={(e) => setPrizeEur(Math.max(0, Number(e.target.value) || 0))} placeholder="0" />
          </div>
          <div>
            <label className={label}>Number of prize tokens</label>
            <input type="number" min={1} max={6} className={field} value={pcts.length} onChange={(e) => setCount(Number(e.target.value))} />
          </div>

          <div>
            <label className={label}>Submission cut-off</label>
            <input type="datetime-local" className={field} value={cutoff} onChange={(e) => setCutoff(e.target.value)} />
          </div>
          <div>
            <label className={label}>Winner pick date</label>
            <input type="datetime-local" className={field} value={winnerPick} onChange={(e) => setWinnerPick(e.target.value)} />
          </div>
        </div>

        {/* Token / split editor */}
        <div className="mt-5 rounded-2xl border border-review-gold/20 bg-review-gold/[0.04] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-review-gold">Prize tokens</span>
            <span className={`text-xs font-medium ${splitValid ? "text-escrow-green" : "text-urgent-red"}`}>
              Split: {sumPct.toFixed(1)}% {splitValid ? "✓" : `(must total 100%)`}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {pcts.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_5rem_6.5rem] items-center gap-2">
                <input className={field} value={labels[i] ?? ""} onChange={(e) => setLabelAt(i, e.target.value)} placeholder={`Prize ${i + 1}`} />
                <div className="relative">
                  <input type="number" min={0} className={`${field} pr-7`} value={p || ""} onChange={(e) => setPct(i, Number(e.target.value) || 0)} />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">%</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    className={`${field} pl-6`}
                    value={amounts[i] != null ? Math.round(amounts[i]) / 100 : ""}
                    onChange={(e) => setEur(i, Number(e.target.value) || 0)}
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/40">€</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-white/45">Allocated</span>
            <span className={`font-mono font-medium ${amounts.reduce((s, a) => s + a, 0) === prizeMinor ? "text-escrow-green" : "text-white/70"}`}>
              {fmt(amounts.reduce((s, a) => s + a, 0))} / {fmt(prizeMinor)}
            </span>
          </div>
        </div>

        {/* Auto terms preview */}
        <button onClick={() => setShowTerms((v) => !v)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/55 transition-colors hover:text-white">
          <Icon name="file" size={13} /> {showTerms ? "Hide" : "View"} auto terms of admission
        </button>
        {showTerms && <p className="mt-2 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs leading-relaxed text-white/55">{CONTEST_TERMS}</p>}

        {error && <p className="mt-3 text-xs text-urgent-red">{error}</p>}

        <div className="mt-5">
          <Button tone="gold" arrow disabled={!canSubmit} onClick={submit}>
            {pending ? "Saving…" : funding === "grid" ? "Create & go live" : "Create (collect funding)"}
          </Button>
        </div>
      </Card>

      {/* Contest list */}
      <div className="mt-4 flex flex-col gap-2.5">
        {!contests ? (
          <p className="text-sm text-white/40">Loading contests…</p>
        ) : contests.length === 0 ? (
          <p className="text-sm text-white/40">No contests yet.</p>
        ) : (
          contests.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">{c.title}</span>
                    <StatusPill tone={STATUS_TONE[c.status] ?? "blue"}>{c.status.replace("_", " ")}</StatusPill>
                  </div>
                  <div className="mt-0.5 text-xs text-white/45">
                    {c.type} · {fmt(c.prizeAmount, c.currency)} · {c.tokens.length} tokens · {c.fundingSource === "grid" ? "GRID-funded" : "Brand-funded"} · {c.submissionCount} entries
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button tone="gold" disabled={pending} onClick={() => act(() => promoteContest(c.id))}>
                    Promote
                  </Button>
                  {pinned.has(`contest:${c.id}`) ? (
                    <Button variant="ghost" disabled={pending} onClick={() => act(() => unpinFromHome("contest", c.id))}>
                      Unpin
                    </Button>
                  ) : (
                    <Button variant="ghost" disabled={pending} onClick={() => act(() => pinToHome("contest", c.id))}>
                      Pin to home
                    </Button>
                  )}
                  {c.status !== "closed" ? (
                    <Button variant="ghost" disabled={pending} onClick={() => act(() => updateContestStatus(c.id, "closed"))}>
                      Close
                    </Button>
                  ) : (
                    <Button variant="ghost" disabled={pending} onClick={() => act(() => updateContestStatus(c.id, "live"))}>
                      Re-open
                    </Button>
                  )}
                  <Button variant="ghost" disabled={pending} onClick={() => act(() => deleteContest(c.id))}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
