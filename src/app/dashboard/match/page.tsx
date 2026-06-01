"use client";

import { PageHeader, Surface, Card, MediaTile, Button, Icon, Ring } from "@/components/dashboard/ui";
import { useSheet, SheetHeader } from "@/components/dashboard/sheet";
import { MATCHES, type Match } from "@/lib/createearn";

function Chips({ items, color = "white" }: { items: string[]; color?: "white" | "cyan" | "purple" }) {
  const cls = color === "cyan" ? "text-aerial-cyan ring-aerial-cyan/25 bg-aerial-cyan/10" : color === "purple" ? "text-ai-purple ring-ai-purple/25 bg-ai-purple/10" : "text-white/70 ring-white/10 bg-white/[0.05]";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${cls}`}>{i}</span>
      ))}
    </div>
  );
}

function tone(score: number) {
  return score >= 90 ? "escrow" : score >= 80 ? "blue" : "gold";
}

function MatchSheet({ m }: { m: Match }) {
  const { open } = useSheet();
  const factors = [
    { label: "Style match", score: Math.min(100, m.score + 2) },
    { label: "Industry match", score: Math.min(100, m.score - 4) },
    { label: "Budget match", score: Math.min(100, m.score - 8) },
    { label: "Portfolio match", score: Math.min(100, m.score + 1) },
  ];
  return (
    <div>
      <SheetHeader title={`${m.name} — ${m.score}% match`} subtitle={`${m.industry} · ${m.budget}`} />
      <div className="flex items-center gap-5">
        <Ring value={m.score} size={92} stroke={7} tone={tone(m.score)}>
          <span className="font-mono text-xl font-semibold text-white">{m.score}</span>
          <span className="text-[9px] uppercase tracking-wider text-white/40">match</span>
        </Ring>
        <div className="min-w-0">
          <div className="text-sm leading-relaxed text-white/70">{m.reason}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-escrow-green">
            <Icon name="trending" size={14} /> {m.bookingProbability}% booking probability
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {factors.map((f) => (
          <div key={f.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-white/65">{f.label}</span>
              <span className="font-mono text-white/85">{f.score}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-grid-blue transition-[width] duration-500" style={{ width: `${f.score}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/40">Shared industries</div>
        <Chips items={m.sharedIndustries} color="cyan" />
      </div>
      <div className="mt-4">
        <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/40">Shared visual style</div>
        <Chips items={m.sharedStyle} color="purple" />
      </div>

      <div className="mt-6">
        <Button full tone="green" arrow onClick={() => open(<MatchSheet m={m} />)}>
          Reach out to {m.name}
        </Button>
      </div>
    </div>
  );
}

export default function MatchScorePage() {
  const { open } = useSheet();
  const avg = Math.round(MATCHES.reduce((a, m) => a + m.score, 0) / MATCHES.length);

  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <PageHeader eyebrow="Create & earn" tone="cyan" title="Match Score™" subtitle="Clients matched to your style, budget fit and portfolio — ranked by fit." />
      </div>

      <div className="rise grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
        {[
          { label: "Matches", value: String(MATCHES.length) },
          { label: "Avg. fit", value: `${avg}%` },
          { label: "Top match", value: `${MATCHES[0].score}%` },
        ].map((s) => (
          <Surface key={s.label} radius="1.25rem" inner="p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">{s.label}</div>
            <div className="mt-1.5 font-mono text-2xl font-semibold tracking-tight text-white">{s.value}</div>
          </Surface>
        ))}
      </div>

      <div className="rise grid gap-4 lg:grid-cols-3" style={{ animationDelay: "120ms" }}>
        {MATCHES.map((m) => (
          <Card key={m.id} hover className="overflow-hidden">
            <button type="button" onClick={() => open(<MatchSheet m={m} />)} className="block w-full text-left">
              <div className="relative">
                <MediaTile tile={m.tile} ratio="16 / 10" rounded="rounded-t-3xl" />
                <div className="absolute right-3 top-3">
                  <Ring value={m.score} size={58} stroke={5} tone={tone(m.score)}>
                    <span className="font-mono text-xs font-semibold text-white">{m.score}</span>
                  </Ring>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-base font-semibold text-white">{m.name}</h3>
                  <span className="shrink-0 text-xs text-white/45">{m.budget}</span>
                </div>
                <div className="mt-0.5 text-xs text-white/50">{m.industry}</div>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/55">{m.reason}</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-escrow-green">
                    <Icon name="trending" size={13} /> {m.bookingProbability}% likely
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-aerial-cyan">
                    View match <Icon name="arrow" size={12} />
                  </span>
                </div>
              </div>
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
