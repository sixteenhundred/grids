"use client";

import { PageHeader, Surface, Card, MediaTile, Icon } from "@/components/dashboard/ui";
import { PERFORMANCE } from "@/lib/clienthq";

function TrendChart({ data }: { data: number[] }) {
  const max = Math.max(...data) * 1.12;
  const W = 600;
  const H = 150;
  const x = (i: number) => (i / (data.length - 1)) * W;
  const y = (v: number) => H - (v / max) * (H - 10) - 5;
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-40 w-full">
      <defs>
        <linearGradient id="perf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5aa9f5" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#5aa9f5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#perf)" />
      <path d={line} fill="none" stroke="#5aa9f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="#0a0b0e" stroke="#5aa9f5" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function TopCard({ label, title, metric, tile }: { label: string; title: string; metric: string; tile: { from: string; to: string; title: string } }) {
  return (
    <Card hover className="overflow-hidden">
      <MediaTile tile={tile} ratio="16 / 10" rounded="rounded-t-3xl">
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/85 backdrop-blur">
          {label}
        </span>
      </MediaTile>
      <div className="p-4">
        <div className="truncate text-sm font-semibold text-white">{title}</div>
        <div className="mt-0.5 font-mono text-sm text-escrow-green">{metric}</div>
      </div>
    </Card>
  );
}

export default function ContentPerformancePage() {
  const p = PERFORMANCE;
  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <PageHeader eyebrow="Client HQ" tone="cyan" title="Content Performance™" subtitle="See exactly how your delivered content performs — and the ROI it drives." />
      </div>

      {/* Totals */}
      <div className="rise grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" style={{ animationDelay: "60ms" }}>
        {p.totals.map((t) => (
          <Surface key={t.label} radius="1.25rem" inner="p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">{t.label}</div>
            <div className="mt-1 font-mono text-xl font-semibold tracking-tight text-white">{t.value}</div>
            <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-escrow-green">
              <Icon name="trending" size={11} /> {t.delta}
            </div>
          </Surface>
        ))}
      </div>

      {/* Trend */}
      <div className="rise" style={{ animationDelay: "120ms" }}>
        <Surface radius="2rem" inner="p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">Engagement trend · last 12 weeks</span>
            <span className="inline-flex items-center gap-1 text-xs text-escrow-green"><Icon name="trending" size={13} /> +162% since launch</span>
          </div>
          <TrendChart data={p.trend} />
        </Surface>
      </div>

      {/* Top performers */}
      <div className="rise" style={{ animationDelay: "160ms" }}>
        <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-white/40">Top performers</div>
        <div className="grid gap-4 sm:grid-cols-3">
          <TopCard label="Best reel" title={p.top.reel.title} metric={p.top.reel.metric} tile={p.top.reel.tile} />
          <TopCard label="Best photo" title={p.top.photo.title} metric={p.top.photo.metric} tile={p.top.photo.tile} />
          <TopCard label="Best campaign" title={p.top.campaign.title} metric={p.top.campaign.metric} tile={p.top.campaign.tile} />
        </div>
      </div>

      {/* Leaderboard */}
      <div className="rise" style={{ animationDelay: "200ms" }}>
        <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-white/40">Content leaderboard</div>
        <div className="flex flex-col gap-2.5">
          {p.leaderboard.map((c) => (
            <Card key={c.rank} className="flex items-center gap-4 p-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold ${c.rank === 1 ? "bg-review-gold/15 text-review-gold ring-1 ring-review-gold/30" : "bg-white/[0.06] text-white/60"}`}>
                {c.rank}
              </span>
              <MediaTile tile={c.tile} className="h-12 w-12 shrink-0" rounded="rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{c.title}</div>
                <div className="text-xs text-white/45">{c.type}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-sm font-semibold text-white">{c.views}</div>
                <div className="text-[11px] text-aerial-cyan">{c.eng} eng</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
