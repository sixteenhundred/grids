"use client";

import { useState } from "react";
import { PageHeader, Surface, Icon } from "@/components/dashboard/ui";
import { money } from "@/lib/createearn";

const MARKET = { average: 2800, suggested: 3600, premium: 4800 };

function EarningsGraph({ monthly }: { monthly: number }) {
  const months = 12;
  const pts = Array.from({ length: months }, (_, i) => monthly * (0.78 + i * 0.04));
  const max = Math.max(...pts, 1) * 1.12;
  const W = 600;
  const H = 170;
  const x = (i: number) => (i / (months - 1)) * W;
  const y = (v: number) => H - (v / max) * (H - 10) - 5;
  const line = pts.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-44 w-full">
      <defs>
        <linearGradient id="earn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4fd07a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#4fd07a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#earn)" />
      <path d={line} fill="none" stroke="#4fd07a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="#0a0b0e" stroke="#4fd07a" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; fmt: (n: number) => string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.14em] text-white/45">{label}</span>
        <span className="font-mono text-sm font-semibold text-white">{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-escrow-green" />
    </div>
  );
}

export default function PriceIntelligencePage() {
  const [rate, setRate] = useState(3600);
  const [bookings, setBookings] = useState(6);

  const monthly = rate * bookings;
  const yearly = monthly * 12;

  const barMax = MARKET.premium * 1.15;
  const bars = [
    { label: "Average market", value: MARKET.average, color: "bg-white/25" },
    { label: "Suggested", value: MARKET.suggested, color: "bg-grid-blue" },
    { label: "Premium market", value: MARKET.premium, color: "bg-review-gold" },
    { label: "Your rate", value: rate, color: "bg-escrow-green" },
  ];
  const position = rate >= MARKET.premium ? "premium" : rate >= MARKET.suggested ? "competitive" : rate >= MARKET.average ? "fair" : "under market";

  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <PageHeader eyebrow="Create & earn" tone="escrow" title="Price Intelligence™" subtitle="Your earnings command center — tune your rate, watch the projection move." />
      </div>

      {/* Projection hero */}
      <div className="rise" style={{ animationDelay: "60ms" }}>
        <Surface radius="2rem" inner="p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
            <div className="flex flex-col justify-center gap-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">Projected monthly</div>
                <div className="font-mono text-4xl font-semibold tracking-tight text-escrow-green transition-all">{money(monthly)}</div>
                <div className="mt-1 text-sm text-white/45">{money(yearly)} / year</div>
              </div>
              <div className="flex flex-col gap-4">
                <Slider label="Day rate" value={rate} min={1500} max={6000} step={100} onChange={setRate} fmt={(n) => `${money(n)}/day`} />
                <Slider label="Bookings / month" value={bookings} min={1} max={20} step={1} onChange={setBookings} fmt={(n) => `${n}`} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">12-month projection</span>
                <span className="inline-flex items-center gap-1 text-xs text-escrow-green"><Icon name="trending" size={13} /> {position}</span>
              </div>
              <EarningsGraph monthly={monthly} />
            </div>
          </div>
        </Surface>
      </div>

      {/* Market comparison */}
      <div className="rise" style={{ animationDelay: "120ms" }}>
        <Surface radius="2rem" inner="p-6">
          <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/40">Market comparison · day rate</div>
          <p className="mb-5 text-sm text-white/55">Your rate is <span className="font-medium text-white">{position}</span> for a verified real-estate photographer in LA.</p>
          <div className="flex flex-col gap-4">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-white/65">{b.label}</span>
                  <span className="font-mono font-semibold text-white">{money(b.value)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
                  <div className={`h-full rounded-full transition-[width] duration-500 ${b.color}`} style={{ width: `${(b.value / barMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}
