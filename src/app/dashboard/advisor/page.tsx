"use client";

import { PageHeader, Surface, Card, Button, Icon, Ring } from "@/components/dashboard/ui";
import type { IconName } from "@/components/dashboard/icons";
import { MARKETING, type Insight } from "@/lib/clienthq";

const INSIGHT_META: Record<Insight["kind"], { icon: IconName; tint: string; text: string; ring: string; label: string }> = {
  gap: { icon: "layout", tint: "bg-review-gold/12", text: "text-review-gold", ring: "ring-review-gold/25", label: "Content gap" },
  opportunity: { icon: "trending", tint: "bg-aerial-cyan/12", text: "text-aerial-cyan", ring: "ring-aerial-cyan/25", label: "Opportunity" },
  strength: { icon: "check", tint: "bg-escrow-green/12", text: "text-escrow-green", ring: "ring-escrow-green/25", label: "Strength" },
  risk: { icon: "shield", tint: "bg-urgent-red/12", text: "text-urgent-red", ring: "ring-urgent-red/25", label: "Risk" },
};

const CHANNEL_TONE = {
  gold: "text-review-gold",
  red: "text-urgent-red",
} as const;

export default function MarketingAdvisorPage() {
  const m = MARKETING;
  const maxComp = Math.max(...m.competitors.map((c) => c.score)) * 1.1;

  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <PageHeader eyebrow="Client HQ" tone="purple" title="AI Marketing Advisor™" subtitle="GRID reads your Instagram, website & profile — then tells you what to fix." />
      </div>

      {/* Brand health + scores */}
      <div className="rise grid gap-4 lg:grid-cols-[1fr_1.6fr]" style={{ animationDelay: "60ms" }}>
        <Surface radius="2rem" inner="p-6">
          <div className="flex items-center gap-5">
            <Ring value={m.brandHealth} size={104} stroke={8} tone="purple">
              <span className="font-mono text-2xl font-semibold text-white">{m.brandHealth}</span>
              <span className="text-[9px] uppercase tracking-wider text-white/40">health</span>
            </Ring>
            <div>
              <div className="text-sm font-semibold text-white">Brand health</div>
              <p className="mt-1 text-xs leading-snug text-white/55">Solid foundation, but frequency & consistency are holding you back.</p>
            </div>
          </div>
        </Surface>
        <Surface radius="2rem" inner="p-6">
          <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-white/40">Content health</div>
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {m.scores.map((s) => (
              <div key={s.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-white/65">{s.label}</span>
                  <span className="font-mono font-semibold text-white">{s.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div className={`h-full rounded-full transition-[width] duration-500 ${s.value >= 80 ? "bg-escrow-green" : s.value >= 60 ? "bg-grid-blue" : "bg-review-gold"}`} style={{ width: `${s.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      {/* Channels analyzed */}
      <div className="rise grid gap-3 sm:grid-cols-3" style={{ animationDelay: "120ms" }}>
        {m.channels.map((c) => (
          <Surface key={c.label} radius="1.5rem" inner="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">{c.label}</span>
              <span className={`h-2 w-2 rounded-full ${c.tone === "red" ? "bg-urgent-red" : "bg-review-gold"}`} />
            </div>
            <div className={`mt-2 font-mono text-sm ${CHANNEL_TONE[c.tone]}`}>{c.value}</div>
            <div className="mt-0.5 text-xs text-white/45">{c.sub}</div>
          </Surface>
        ))}
      </div>

      {/* Competitor benchmark */}
      <div className="rise" style={{ animationDelay: "160ms" }}>
        <Surface radius="2rem" inner="p-6">
          <div className="mb-4 text-[10px] uppercase tracking-[0.16em] text-white/40">Competitor benchmark · content score</div>
          <div className="flex flex-col gap-3">
            {m.competitors.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className={`w-32 shrink-0 truncate text-sm ${c.you ? "font-semibold text-white" : "text-white/55"}`}>{c.name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div className={`h-full rounded-full transition-[width] duration-500 ${c.you ? "bg-ai-purple" : "bg-white/25"}`} style={{ width: `${(c.score / maxComp) * 100}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right font-mono text-sm text-white">{c.score}</span>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      {/* Insights / opportunity alerts */}
      <div className="rise" style={{ animationDelay: "200ms" }}>
        <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-white/40">Recommendations</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {m.insights.map((ins, i) => {
            const meta = INSIGHT_META[ins.kind];
            return (
              <Card key={i} className="flex items-start gap-3 p-4">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${meta.tint} ${meta.text} ${meta.ring}`}>
                  <Icon name={meta.icon} size={17} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{ins.title}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${meta.tint} ${meta.text}`}>{meta.label}</span>
                  </div>
                  <p className="mt-1 text-xs leading-snug text-white/55">{ins.detail}</p>
                </div>
              </Card>
            );
          })}
        </div>
        <div className="mt-5">
          <Button tone="purple" arrow href="/dashboard/concierge">
            <Icon name="sparkles" size={15} /> Fix gaps with Concierge
          </Button>
        </div>
      </div>
    </div>
  );
}
