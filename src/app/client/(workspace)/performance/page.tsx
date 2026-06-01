"use client";

import { useMemo, useState } from "react";
import { useClient } from "@/components/client/client-context";
import {
  SectionTitle,
  Panel,
  MetricCard,
  StatusBadge,
  ProgressBar,
  FeatureTag,
  DemoModeNotice,
} from "@/components/client/ui";
import { Button } from "@/components/dashboard/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";
import {
  PERF_MONTHLY_SPEND,
  PERF_CONTENT_VOLUME,
  PERF_MONTHS,
  PERF_STATS,
  TOP_CREATORS,
} from "@/lib/client/mock";

/* -------------------------------------------------------------------------- */
/*  Local types + helpers                                                      */
/* -------------------------------------------------------------------------- */

type RangeKey = "3m" | "6m";

const RANGE_MONTHS: Record<RangeKey, number> = { "3m": 3, "6m": 6 };

const STAT_ICONS: IconName[] = ["verified", "clock", "star", "grid", "trending", "chart"];
const STAT_ACCENTS = [
  "text-escrow-green",
  "text-aerial-cyan",
  "text-review-gold",
  "text-aerial-cyan",
  "text-escrow-green",
  "text-review-gold",
];

const CURRENCY = "#0071e3"; // grid-blue
const VOLUME = "#4fd07a"; // escrow-green

const fmtMoney = (n: number) => `$${n.toLocaleString("en-US")}`;
const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

/* -------------------------------------------------------------------------- */
/*  Spend area chart (inline SVG)                                              */
/* -------------------------------------------------------------------------- */

function SpendChart({ values, labels }: { values: number[]; labels: string[] }) {
  const W = 560;
  const H = 220;
  const padX = 18;
  const padTop = 18;
  const padBottom = 30;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const max = Math.max(...values, 1);

  const points = values.map((v, i) => {
    const x = values.length === 1 ? padX + innerW / 2 : padX + (innerW * i) / (values.length - 1);
    const y = padTop + innerH * (1 - v / max);
    return { x, y, v };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Monthly spend trend">
      <defs>
        <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CURRENCY} stopOpacity="0.35" />
          <stop offset="100%" stopColor={CURRENCY} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[0, 0.5, 1].map((t) => {
        const y = padTop + innerH * t;
        return <line key={t} x1={padX} y1={y} x2={W - padX} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />;
      })}
      <path d={areaPath} fill="url(#spendFill)" />
      <path d={linePath} fill="none" stroke={CURRENCY} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="#0a0c12" stroke={CURRENCY} strokeWidth={2} />
          <text x={p.x} y={H - 10} textAnchor="middle" className="fill-white/40" fontSize={11}>
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Content volume bar chart (inline SVG)                                       */
/* -------------------------------------------------------------------------- */

function VolumeChart({ values, labels }: { values: number[]; labels: string[] }) {
  const W = 560;
  const H = 220;
  const padX = 18;
  const padTop = 18;
  const padBottom = 30;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const max = Math.max(...values, 1);
  const slot = innerW / values.length;
  const barW = Math.min(46, slot * 0.55);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Content volume by month">
      <defs>
        <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={VOLUME} stopOpacity="0.9" />
          <stop offset="100%" stopColor={VOLUME} stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => {
        const y = padTop + innerH * t;
        return <line key={t} x1={padX} y1={y} x2={W - padX} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />;
      })}
      {values.map((v, i) => {
        const h = innerH * (v / max);
        const x = padX + slot * i + (slot - barW) / 2;
        const y = padTop + innerH - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={5} fill="url(#volFill)" />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="fill-white/70" fontSize={11} fontWeight={600}>
              {v}
            </text>
            <text x={x + barW / 2} y={H - 10} textAnchor="middle" className="fill-white/40" fontSize={11}>
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Radial success rate                                                         */
/* -------------------------------------------------------------------------- */

function SuccessRadial({ value }: { value: number }) {
  const size = 168;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={VOLUME}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.32,0.72,0,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-semibold tracking-tight text-white">{value}%</span>
        <span className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-white/45">Success</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function PerformancePage() {
  const { toast } = useClient();
  const [range, setRange] = useState<RangeKey>("6m");

  const months = RANGE_MONTHS[range];

  // Slice the trailing N months — recomputed on range change (no time/random in render).
  const { spend, volume, labels } = useMemo(() => {
    const start = Math.max(0, PERF_MONTHS.length - months);
    return {
      spend: PERF_MONTHLY_SPEND.slice(start),
      volume: PERF_CONTENT_VOLUME.slice(start),
      labels: PERF_MONTHS.slice(start),
    };
  }, [months]);

  const totalSpend = useMemo(() => sum(spend), [spend]);
  const totalVolume = useMemo(() => sum(volume), [volume]);
  const successRate = 94; // matches PERF_STATS completion rate

  // Best performing category derived from top creators (highest score wins).
  const bestCreator = useMemo(
    () => [...TOP_CREATORS].sort((a, b) => b.score - a.score)[0],
    [],
  );

  const maxCreatorProjects = useMemo(
    () => Math.max(...TOP_CREATORS.map((c) => c.projects), 1),
    [],
  );

  return (
    <div className="flex flex-col gap-7">
      {/* header */}
      <SectionTitle
        title="Performance dashboard"
        subtitle="Spend, output and creator performance across your creative operation."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <FeatureTag feature="performance" />
            <Button tone="white" variant="ghost" onClick={() => toast("Report refreshed")}>
              <Icon name="trending" size={15} /> Refresh
            </Button>
            <Button tone="blue" onClick={() => toast("Report exported (demo)")}>
              <Icon name="download" size={15} /> Export
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DemoModeNotice />
        {/* range filter */}
        <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {(["3m", "6m"] as RangeKey[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRange(r);
                toast(`Showing last ${RANGE_MONTHS[r]} months`);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                range === r ? "bg-white text-grid-black" : "text-white/55 hover:text-white"
              }`}
            >
              {r === "3m" ? "Last 3 months" : "Last 6 months"}
            </button>
          ))}
        </div>
      </div>

      {/* metric cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {PERF_STATS.map((stat, i) => (
          <MetricCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={STAT_ICONS[i % STAT_ICONS.length]}
            accent={STAT_ACCENTS[i % STAT_ACCENTS.length]}
          />
        ))}
      </div>

      {/* charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Monthly spend</h3>
              <p className="mt-0.5 text-xs text-white/45">Total this period</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold tracking-tight text-aerial-cyan">{fmtMoney(totalSpend)}</div>
              <StatusBadge label="+12% MoM" tone="green" />
            </div>
          </div>
          <SpendChart values={spend} labels={labels} />
        </Panel>

        <Panel>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Content volume</h3>
              <p className="mt-0.5 text-xs text-white/45">Assets delivered</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold tracking-tight text-escrow-green">{totalVolume} assets</div>
              <StatusBadge label={`${labels.length} mo`} tone="gray" />
            </div>
          </div>
          <VolumeChart values={volume} labels={labels} />
        </Panel>
      </div>

      {/* success + best category */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="flex flex-col items-center justify-center text-center">
          <h3 className="mb-4 text-sm font-semibold text-white">Project success rate</h3>
          <SuccessRadial value={successRate} />
          <p className="mt-4 max-w-[15rem] text-xs text-white/45">
            Projects delivered on spec, on budget and accepted on first or second review.
          </p>
        </Panel>

        <Panel className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">Best performing category</h3>
            <StatusBadge label="This quarter" tone="gold" />
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-grid-blue/15 text-aerial-cyan ring-1 ring-grid-blue/25">
              <Icon name="camera" size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold tracking-tight text-white">{bestCreator.category}</div>
              <div className="mt-0.5 text-xs text-white/45">
                Led by {bestCreator.name} · {bestCreator.projects} projects · {bestCreator.score.toFixed(1)} rating
              </div>
            </div>
            <div className="hidden text-right sm:block">
              <div className="text-2xl font-semibold tracking-tight text-escrow-green">{bestCreator.score.toFixed(1)}</div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Avg score</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Avg ROI", value: "3.8x" },
              { label: "Engagement", value: "+27%" },
              { label: "On-time", value: "94%" },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-3 text-center">
                <div className="text-lg font-semibold tracking-tight text-white">{m.value}</div>
                <div className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-white/45">{m.label}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* creator performance — list with score bars */}
      <Panel>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">Creator performance</h3>
          <Button tone="white" variant="ghost" onClick={() => toast("Full leaderboard opened (demo)")}>
            View all
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {TOP_CREATORS.map((c) => (
            <div key={c.name} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-aerial-cyan">
                <Icon name="user" size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-white">{c.name}</span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-review-gold">
                    <Icon name="star" size={13} /> {c.score.toFixed(1)}
                  </span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={(c.score / 5) * 100} tone="bg-escrow-green" />
                </div>
                <div className="mt-1 text-[11px] text-white/45">
                  {c.category} · {c.projects} projects
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* top creators table */}
      <Panel>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">Top creators</h3>
          <span className="text-xs text-white/45">{TOP_CREATORS.length} ranked</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/8 text-[11px] uppercase tracking-[0.12em] text-white/40">
                <th className="py-2.5 pr-3 font-medium">Creator</th>
                <th className="px-3 py-2.5 font-medium">Category</th>
                <th className="px-3 py-2.5 font-medium">Projects</th>
                <th className="px-3 py-2.5 font-medium">Rating</th>
                <th className="px-3 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {TOP_CREATORS.map((c, i) => (
                <tr key={c.name} className="border-b border-white/5 last:border-0">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.06] text-[11px] font-semibold text-white/60">
                        {i + 1}
                      </span>
                      <span className="font-medium text-white">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-white/60">{c.category}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white/70">{c.projects}</span>
                      <span className="hidden w-20 sm:block">
                        <ProgressBar value={(c.projects / maxCreatorProjects) * 100} tone="bg-grid-blue" />
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge label={`${c.score.toFixed(1)} ★`} tone={c.score >= 4.9 ? "green" : "gold"} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toast(`Rehire request sent to ${c.name}`)}
                      className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75 transition-colors hover:text-white"
                    >
                      Rehire
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
