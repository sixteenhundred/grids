"use client";

import { PageHeader, Card, StatusPill, Button, Icon } from "@/components/dashboard/ui";
import { useSheet, SheetHeader } from "@/components/dashboard/sheet";
import { useRole } from "@/components/dashboard/role-context";
import { TRENDS } from "@/lib/grid-data";

type Trend = (typeof TRENDS)[number];

function TrendSheet({ trend, rank }: { trend: Trend; rank: number }) {
  const { role } = useRole();
  return (
    <div>
      <SheetHeader title={trend.title} subtitle={`#${rank} rising this month`} />
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-escrow-green/25 bg-escrow-green/[0.07] p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-escrow-green/15 text-escrow-green ring-1 ring-escrow-green/30">
          <Icon name="trending" size={20} />
        </span>
        <div>
          <div className="text-sm font-semibold text-white">{trend.change} demand</div>
          <div className="text-xs text-white/55">vs the previous 30 days</div>
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">Why it&apos;s rising</div>
      <p className="mt-2 text-sm leading-relaxed text-white/70">
        Clients are increasingly briefing “{trend.title.toLowerCase()}” for launches and listings — it photographs premium and performs well on social. Bookings tagged with this style are converting above average.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {[
          { label: "Avg. budget", value: "€4.6k" },
          { label: "Lead time", value: "5 days" },
          { label: "Repeat rate", value: "62%" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
            <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">{s.label}</div>
            <div className="mt-1 font-mono text-sm font-semibold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {role === "client" ? (
          <Button full tone="green" arrow href="/dashboard/browse">Find creators for this</Button>
        ) : (
          <Button full arrow href="/dashboard/studio">Plan a shoot in Studio</Button>
        )}
      </div>
    </div>
  );
}

export default function TrendsPage() {
  const { open } = useSheet();
  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader eyebrow="Trends" tone="gold" title="Rising this month." subtitle="What clients are booking and creatives are shooting." />
      </div>

      <div className="rise flex flex-col gap-3" style={{ animationDelay: "60ms" }}>
        {TRENDS.map((t, i) => (
          <Card key={t.title} hover className="p-0">
            <button type="button" onClick={() => open(<TrendSheet trend={t} rank={i + 1} />)} className="flex w-full items-center justify-between p-5 text-left">
              <div className="flex items-center gap-4">
                <span className="font-mono text-white/40">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-medium text-white">{t.title}</span>
                <Icon name="trending" size={16} className="text-escrow-green" />
              </div>
              <div className="flex items-center gap-3">
                <StatusPill tone="escrow">{t.change}</StatusPill>
                <Icon name="chevron" size={16} className="text-white/30" />
              </div>
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
