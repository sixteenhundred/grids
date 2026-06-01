"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Surface, Button, Icon, ACCENT } from "@/components/dashboard/ui";
import type { IconName } from "@/components/dashboard/icons";
import { useSheet, SheetHeader } from "@/components/dashboard/sheet";
import { OperationBackground } from "@/components/dashboard/operation-bg";
import { useSession } from "@/lib/auth-client";
import type { Accent } from "@/lib/grid-data";
import {
  WIDGETS,
  ACCENTS,
  BG_PRESETS,
  STATUS,
  PRIORITIES,
  URGENCY_META,
  OPERATIONS,
  OP_STAGES,
  stageProgress,
  TIMELINE,
  PIPE_STAGES,
  PIPELINE,
  DELIVERABLES,
  FINANCE,
  CLIENT_HEALTH,
  healthTier,
  AI_INSIGHTS,
  OPS_FEED,
  ARCHIVE,
  loadWorkspace,
  saveWorkspace,
  DEFAULT_WORKSPACE,
  fileToImageDataUrl,
  money,
  type Workspace,
  type Operation,
  type PipeClient,
  type PipeStage,
  type Archived,
} from "@/lib/operation";

const SPAN2 = new Set(["operations", "finance", "pipeline"]);

/* Theme helpers — derive readable, on-dark colours from the chosen palette. */
function hexToRgb(h: string): [number, number, number] {
  const m = h.replace("#", "");
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const int = parseInt(n, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}
/** Lift a palette colour toward white so it stays legible as text/dots on dark surfaces. */
function bright(h: string): string {
  const [r, g, b] = hexToRgb(h);
  const lift = (c: number) => Math.round(c + (255 - c) * 0.45);
  return `rgb(${lift(r)}, ${lift(g)}, ${lift(b)})`;
}
function withAlpha(h: string, a: number): string {
  const [r, g, b] = hexToRgb(h);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/* ════════════════════════════════════════════════════════════════════════ */
/*  Customize sheet                                                            */
/* ════════════════════════════════════════════════════════════════════════ */

function CustomizeSheet({ ws, onChange }: { ws: Workspace; onChange: (w: Partial<Workspace>) => void }) {
  // Local copy so the inputs are editable; every change is applied live to the page.
  const [local, setLocal] = useState<Workspace>(ws);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1500);
    return () => clearTimeout(t);
  }, [saved]);
  function apply(patch: Partial<Workspace>) {
    setLocal((p) => ({ ...p, ...patch }));
    onChange(patch); // persisted to localStorage by the page's update()
    setSaved(true);
  }
  async function onBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      try {
        apply({ banner: await fileToImageDataUrl(f, 1400) });
      } catch {
        /* ignore */
      }
    }
  }
  const hidden = WIDGETS.filter((w) => local.hidden.includes(w.id));
  return (
    <div>
      <SheetHeader title="Make it yours" subtitle="Name it, brand it, and arrange it however you work." />

      <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 text-[11px] text-white/55">
        <Icon name="check" size={12} className={saved ? "text-escrow-green" : "text-white/40"} />
        {saved ? "Saved" : "Changes save automatically"}
      </div>

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Workspace name</label>
      <input
        value={local.name}
        onChange={(e) => apply({ name: e.target.value })}
        placeholder="Mission Control, Studio HQ, The War Room…"
        className="mb-5 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-white/25"
      />

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Banner</label>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onBanner} />
      <div className="mb-1 flex gap-2.5">
        <button onClick={() => fileRef.current?.click()} className="flex-1 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] py-3 text-sm text-white/70 transition-colors hover:border-white/30">
          <Icon name="camera" size={15} className="mr-1.5 inline" /> Upload image
        </button>
        {local.banner && (
          <button onClick={() => apply({ banner: null })} className="rounded-2xl border border-white/10 px-4 text-sm text-white/50 transition-colors hover:text-urgent-red">
            Remove
          </button>
        )}
      </div>

      <label className="mb-2 mt-5 block text-xs uppercase tracking-[0.14em] text-white/45">Accent / mood</label>
      <div className="flex flex-wrap gap-2">
        {ACCENTS.map((a) => (
          <button
            key={a.key}
            onClick={() => apply({ accent: a.key })}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${local.accent === a.key ? "border-white/30 bg-white/[0.06] text-white" : "border-white/10 text-white/55 hover:text-white"}`}
          >
            <span className={`h-3 w-3 rounded-full ${a.dot}`} /> {a.label}
          </button>
        ))}
      </div>

      <div className="mb-2 mt-5 flex items-center justify-between">
        <label className="block text-xs uppercase tracking-[0.14em] text-white/45">Moving background</label>
        <button
          role="switch"
          aria-checked={local.bg.on}
          onClick={() => apply({ bg: { ...local.bg, on: !local.bg.on } })}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${local.bg.on ? "bg-grid-blue" : "bg-white/15"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${local.bg.on ? "left-[1.375rem]" : "left-0.5"}`} />
        </button>
      </div>
      {local.bg.on && (
        <>
          <div className="flex flex-wrap gap-2">
            {BG_PRESETS.map((p) => {
              const active = JSON.stringify(p.colors) === JSON.stringify(local.bg.colors);
              return (
                <button
                  key={p.key}
                  onClick={() => apply({ bg: { ...local.bg, colors: p.colors }, accent: p.accent })}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${active ? "border-white/30 bg-white/[0.06] text-white" : "border-white/10 text-white/55 hover:text-white"}`}
                >
                  <span className="flex">{p.colors.map((c, i) => (<span key={i} className={`h-3 w-3 rounded-full ring-1 ring-black/40 ${i > 0 ? "-ml-1" : ""}`} style={{ background: c }} />))}</span>
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {local.bg.colors.map((c, i) => (
              <input
                key={i}
                type="color"
                value={c}
                aria-label={`Background colour ${i + 1}`}
                onChange={(e) => {
                  const colors = [...local.bg.colors];
                  colors[i] = e.target.value;
                  apply({ bg: { ...local.bg, colors } });
                }}
                className="h-9 w-9 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5"
              />
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-white/40">Pick a palette or set each colour. The animation lives behind your widgets — turn it off any time.</p>
        </>
      )}

      {hidden.length > 0 && (
        <>
          <label className="mb-2 mt-5 block text-xs uppercase tracking-[0.14em] text-white/45">Hidden widgets</label>
          <div className="flex flex-col gap-2">
            {hidden.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                <span className="text-sm text-white/70">{w.title}</span>
                <button onClick={() => apply({ hidden: local.hidden.filter((x) => x !== w.id) })} className="text-sm font-medium text-aerial-cyan transition-colors hover:text-white">Show</button>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="mt-5 text-xs leading-relaxed text-white/40">
        Tip: turn on <span className="text-white/70">Arrange</span> on the page to drag, collapse or hide any widget. Your layout saves automatically.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
/*  Small shared bits                                                          */
/* ════════════════════════════════════════════════════════════════════════ */

function Spark({ data, accent, color: colorProp }: { data: number[]; accent: Accent; color?: string }) {
  const color = colorProp ?? ({ blue: "#0071e3", cyan: "#5aa9f5", purple: "#9a7fe0", escrow: "#4fd07a", gold: "#f5a14f", red: "#ff3b30", green: "#1a9e4a" }[accent] ?? "#5aa9f5");
  const max = Math.max(...data) * 1.12;
  const W = 320, H = 64;
  const x = (i: number) => (i / (data.length - 1)) * W;
  const y = (v: number) => H - (v / max) * (H - 6) - 3;
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-16 w-full">
      <defs>
        <linearGradient id="opspark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#opspark)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Bar({ value, tone = "blue", color }: { value: number; tone?: Accent; color?: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
      {color ? (
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      ) : (
        <div className={`h-full rounded-full ${ACCENT[tone].solid}`} style={{ width: `${Math.min(100, value)}%` }} />
      )}
    </div>
  );
}

/** Pill coloured from the workspace palette (used across the widgets). */
function ThemePill({ color, live = false, children }: { color: string; live?: boolean; children: ReactNode }) {
  const fg = bright(color);
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider"
      style={{ color: fg, backgroundColor: withAlpha(color, 0.14), boxShadow: `inset 0 0 0 1px ${withAlpha(color, 0.3)}` }}
    >
      {live && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: fg }} />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: fg }} />
        </span>
      )}
      {children}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
/*  Page                                                                       */
/* ════════════════════════════════════════════════════════════════════════ */

export default function OperationPage() {
  const router = useRouter();
  const { open } = useSheet();
  const { data: session } = useSession();
  const first = session?.user?.name?.split(" ")[0] ?? "there";

  // Start from defaults so SSR and first client render match; hydrate from
  // localStorage after mount to avoid hydration mismatches on the accent/name.
  const [ws, setWs] = useState<Workspace>(DEFAULT_WORKSPACE);
  const [mounted, setMounted] = useState(false);
  const [arrange, setArrange] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  // Live-ish operational state
  const [ops, setOps] = useState<Operation[]>(OPERATIONS);
  const [archive, setArchive] = useState<Archived[]>(ARCHIVE);
  const [pipeline, setPipeline] = useState<PipeClient[]>(PIPELINE);
  const [pipeOver, setPipeOver] = useState<PipeStage | null>(null);
  const [doneP, setDoneP] = useState<Set<string>>(new Set());
  const [dismissedAi, setDismissedAi] = useState<Set<string>>(new Set());

  useEffect(() => {
    setWs(loadWorkspace());
    setMounted(true);
  }, []);

  function update(patch: Partial<Workspace>) {
    setWs((prev) => {
      const next = { ...prev, ...patch };
      saveWorkspace(next);
      return next;
    });
  }
  const accent = ws.accent;
  const a = ACCENT[accent];

  // The chosen palette is the workspace "theme" — it colours the status numbers
  // and priority urgency, so the whole page matches the customization.
  const palette = ws.bg.colors?.length ? ws.bg.colors : DEFAULT_WORKSPACE.bg.colors;
  const themeAt = (i: number) => palette[i % palette.length];
  const urgencyColor = (u: string) =>
    u === "high" ? palette[0] : u === "med" ? palette[Math.floor((palette.length - 1) / 2)] : palette[palette.length - 1];
  // Each operation stage gets its own palette colour (by stage order).
  const opStageColor = (stage: Operation["stage"]) => themeAt(Math.max(0, OP_STAGES.indexOf(stage)));

  /* widget controls */
  const toggleCollapse = (id: string) => update({ collapsed: ws.collapsed.includes(id) ? ws.collapsed.filter((x) => x !== id) : [...ws.collapsed, id] });
  const hide = (id: string) => update({ hidden: [...ws.hidden, id] });
  function reorder(from: string, to: string) {
    if (from === to) return;
    const order = [...ws.order];
    const fi = order.indexOf(from);
    const ti = order.indexOf(to);
    order.splice(fi, 1);
    order.splice(order.indexOf(to) >= 0 ? order.indexOf(to) : ti, 0, from);
    update({ order });
  }

  /* operations: advance stage → completed → archive */
  function advance(op: Operation) {
    const idx = OP_STAGES.indexOf(op.stage);
    const next = OP_STAGES[Math.min(idx + 1, OP_STAGES.length - 1)];
    if (next === "Completed") {
      setOps((prev) => prev.filter((o) => o.id !== op.id));
      setArchive((prev) => [{ id: op.id, client: op.client, project: op.project, value: op.value, date: "Just now" }, ...prev]);
    } else {
      setOps((prev) => prev.map((o) => (o.id === op.id ? { ...o, stage: next } : o)));
    }
  }
  function movePipe(id: string, stage: PipeStage) {
    setPipeline((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)));
  }

  const visible = useMemo(() => ws.order.filter((id) => !ws.hidden.includes(id)), [ws.order, ws.hidden]);

  /* ── widget content ───────────────────────────────────────────────────── */
  function content(id: string) {
    switch (id) {
      case "priorities": {
        const items = [...PRIORITIES].filter((p) => !doneP.has(p.id)).sort((x, y) => ({ high: 0, med: 1, low: 2 }[x.urgency] - { high: 0, med: 1, low: 2 }[y.urgency]));
        return (
          <div className="flex flex-col gap-2">
            {items.length === 0 && <p className="py-6 text-center text-sm text-white/45">All clear. Nothing needs you right now. ✨</p>}
            {items.map((p) => {
              const m = URGENCY_META[p.urgency];
              return (
                <div key={p.id} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.05]">
                  <button onClick={() => setDoneP((s) => new Set(s).add(p.id))} aria-label="Mark done" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/30 transition-colors hover:border-escrow-green hover:text-escrow-green">
                    <Icon name="check" size={13} />
                  </button>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: bright(urgencyColor(p.urgency)) }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{p.label}</div>
                    <div className="truncate text-xs text-white/45">{p.sub}</div>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider"
                    style={{
                      color: bright(urgencyColor(p.urgency)),
                      backgroundColor: withAlpha(urgencyColor(p.urgency), 0.14),
                      boxShadow: `inset 0 0 0 1px ${withAlpha(urgencyColor(p.urgency), 0.3)}`,
                    }}
                  >
                    {m.label}
                  </span>
                  {p.href && (
                    <button onClick={() => router.push(p.href!)} className="shrink-0 text-white/30 transition-colors hover:text-white">
                      <Icon name="arrow" size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
      case "operations":
        return (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ops.map((op) => {
              const c = opStageColor(op.stage);
              return (
                <div key={op.id} className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                  <div className="relative h-16" style={{ backgroundImage: `linear-gradient(135deg, ${c}, ${themeAt(OP_STAGES.indexOf(op.stage) + 1)})` }}>
                    <span className="absolute left-2.5 top-2.5"><ThemePill color={c} live={op.stage !== "Delivery"}>{op.stage}</ThemePill></span>
                    <span className="absolute right-2.5 top-2.5 rounded-full bg-black/50 px-2 py-0.5 font-mono text-[11px] text-white/85 backdrop-blur">{money(op.value)}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-3.5">
                    <div className="text-[11px] text-white/45">{op.client}</div>
                    <div className="truncate text-sm font-semibold text-white">{op.project}</div>
                    <div className="mt-3">
                      <Bar value={stageProgress(op.stage)} color={bright(c)} />
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-white/45">
                        <span>{stageProgress(op.stage)}%</span>
                        <span className="inline-flex items-center gap-1"><Icon name="clock" size={11} /> {op.due}</span>
                      </div>
                    </div>
                    <p className="mt-2.5 line-clamp-1 text-[11px] text-white/45">{op.activity}</p>
                    <div className="mt-3 flex items-center gap-2 border-t border-white/8 pt-3">
                      <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: bright(op.payment === "Paid" ? palette[palette.length - 1] : op.payment === "In escrow" ? themeAt(2) : palette[0]) }}>
                        <Icon name="wallet" size={11} /> {op.payment}
                      </span>
                      <button onClick={() => advance(op)} className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-white/15">
                        Advance <Icon name="chevron" size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {ops.length === 0 && <p className="col-span-full py-8 text-center text-sm text-white/45">No active operations — time to book the next one.</p>}
          </div>
        );
      case "timeline":
        return (
          <div className="relative ml-1.5 border-l border-white/10 pl-7">
            {TIMELINE.map((e, i) => (
              <div key={i} className="relative pb-6 last:pb-0">
                <span className="absolute -left-[2.5rem] top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-[#0a0b0e]" style={{ color: bright(themeAt(i)), backgroundColor: withAlpha(themeAt(i), 0.16) }}>
                  <Icon name={e.icon} size={13} />
                </span>
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                  <span className="text-sm font-medium leading-tight text-white">{e.label}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-white/35">{e.day}</span>
                </div>
                <div className="mt-1 text-xs leading-relaxed text-white/45">{e.sub}</div>
              </div>
            ))}
          </div>
        );
      case "pipeline":
        return (
          <div className="grid gap-2.5 md:grid-cols-3 xl:grid-cols-5">
            {PIPE_STAGES.map((s, si) => {
              const items = pipeline.filter((c) => c.stage === s.key);
              return (
                <div
                  key={s.key}
                  onDragOver={(e) => { e.preventDefault(); setPipeOver(s.key); }}
                  onDragLeave={() => setPipeOver((p) => (p === s.key ? null : p))}
                  onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("pipe"); if (id) movePipe(id, s.key); setPipeOver(null); }}
                  className={`flex flex-col gap-2 rounded-2xl border p-2 transition-colors ${pipeOver === s.key ? "border-white/25 bg-white/[0.05]" : "border-white/8 bg-white/[0.015]"}`}
                >
                  <div className="flex items-center justify-between px-1 pt-0.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium text-white/80"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: bright(themeAt(si)) }} /> {s.label}</span>
                    <span className="font-mono text-white/35">{items.length}</span>
                  </div>
                  {items.map((c) => (
                    <div key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData("pipe", c.id)} className="cursor-grab rounded-xl border border-white/10 bg-white/[0.04] p-2.5 active:cursor-grabbing">
                      <div className="truncate text-xs font-medium text-white">{c.name}</div>
                      <div className="font-mono text-[11px] text-white/45">{money(c.value)}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      case "deliverables":
        return (
          <div className="flex flex-col gap-2.5">
            {DELIVERABLES.map((d, i) => (
              <div key={d.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{d.label} <span className="text-white/40">· {d.client}</span></span>
                  <ThemePill color={themeAt(i)}>{d.status}</ThemePill>
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="flex-1"><Bar value={(d.done / d.total) * 100} color={bright(themeAt(i))} /></div>
                  <span className="font-mono text-xs text-white/55">{d.done}/{d.total}</span>
                </div>
              </div>
            ))}
          </div>
        );
      case "finance":
        return (
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">Revenue this month</div>
              <div className="font-mono text-3xl font-semibold tracking-tight" style={{ color: bright(themeAt(0)) }}>{money(FINANCE.revenueMonth)}</div>
              <div className="mt-0.5 text-xs text-white/45">{money(FINANCE.revenueYear)} this year</div>
              <Spark data={FINANCE.trend} accent={accent} color={bright(themeAt(2))} />
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: "Pending", value: money(FINANCE.pending) },
                  { label: "In escrow", value: money(FINANCE.escrow) },
                  { label: "Prod. wallet", value: money(FINANCE.productionWallet) },
                  { label: "Outstanding", value: money(FINANCE.outstandingInvoices) },
                  { label: "Client LTV", value: money(FINANCE.clv) },
                  { label: "Avg project", value: money(FINANCE.avgProject) },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-2.5">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-white/40">{s.label}</div>
                    <div className="mt-0.5 font-mono text-sm font-semibold text-white">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/40">Upcoming releases</div>
              <div className="flex flex-col gap-2.5">
                {FINANCE.upcoming.map((u) => (
                  <div key={u.label} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm text-white/80">{u.label}</div>
                      <div className="text-[11px] text-white/40">{u.when}</div>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-semibold" style={{ color: bright(themeAt(0)) }}>{money(u.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "health":
        return (
          <div className="flex flex-col gap-2.5">
            {CLIENT_HEALTH.map((c, i) => {
              const t = healthTier(c.score);
              return (
                <div key={c.name} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold" style={{ color: bright(themeAt(i)), backgroundColor: withAlpha(themeAt(i), 0.14), boxShadow: `inset 0 0 0 1px ${withAlpha(themeAt(i), 0.3)}` }}>{c.score}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{c.name}</div>
                    <div className="truncate text-[11px] text-white/45">{c.note}</div>
                  </div>
                  <ThemePill color={themeAt(i)}>{t.label}</ThemePill>
                </div>
              );
            })}
          </div>
        );
      case "ai":
        return (
          <div className="flex flex-col gap-2.5">
            {AI_INSIGHTS.filter((x) => !dismissedAi.has(x.id)).map((ins, i) => (
              <div key={ins.id} className="flex items-start gap-3 rounded-2xl p-3 bg-white/[0.02]" style={{ boxShadow: `inset 0 0 0 1px ${withAlpha(themeAt(i), 0.3)}` }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ color: bright(themeAt(i)), backgroundColor: withAlpha(themeAt(i), 0.14) }}><Icon name={ins.icon} size={16} /></span>
                <p className="min-w-0 flex-1 text-sm leading-snug text-white/75">{ins.text}</p>
                <button onClick={() => setDismissedAi((s) => new Set(s).add(ins.id))} aria-label="Dismiss" className="shrink-0 text-white/30 transition-colors hover:text-white"><Icon name="x" size={14} /></button>
              </div>
            ))}
            {AI_INSIGHTS.every((i) => dismissedAi.has(i.id)) && <p className="py-4 text-center text-sm text-white/45">Operations look healthy. I’ll flag anything that needs you.</p>}
          </div>
        );
      case "feed":
        return (
          <div className="flex flex-col">
            {OPS_FEED.map((f, i) => (
              <div key={f.id} className="flex items-center gap-3 border-b border-white/8 py-2.5 last:border-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ color: bright(themeAt(i)), backgroundColor: withAlpha(themeAt(i), 0.14) }}><Icon name={f.icon} size={14} /></span>
                <span className="min-w-0 flex-1 truncate text-sm text-white/75">{f.text}</span>
                <span className="shrink-0 font-mono text-[11px] text-white/35">{f.when}</span>
              </div>
            ))}
          </div>
        );
      case "archive":
        return (
          <div className="flex flex-col gap-2">
            {archive.map((ar, i) => (
              <div key={ar.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3 opacity-75 transition-opacity hover:opacity-100">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ color: bright(themeAt(i)), backgroundColor: withAlpha(themeAt(i), 0.14), boxShadow: `inset 0 0 0 1px ${withAlpha(themeAt(i), 0.25)}` }}><Icon name="check" size={14} /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-white/80">{ar.project}</div>
                  <div className="truncate text-[11px] text-white/40">{ar.client} · {ar.date}</div>
                </div>
                <span className="shrink-0 font-mono text-sm text-white/55">{money(ar.value)}</span>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  }

  /* ── status bar ───────────────────────────────────────────────────────── */
  const statusItems: { label: string; value: string; tone?: Accent }[] = [
    { label: "Active", value: String(ops.length || STATUS.projectsActive) },
    { label: "Waiting on client", value: String(STATUS.waitingClient), tone: "gold" },
    { label: "Editing", value: String(STATUS.editing), tone: "purple" },
    { label: "Payments pending", value: String(STATUS.paymentsPending), tone: "gold" },
    { label: "Contracts pending", value: String(STATUS.contractsPending), tone: "red" },
    { label: "Revenue / mo", value: money(STATUS.revenueMonth), tone: "escrow" },
    { label: "Free days", value: String(STATUS.availableDays), tone: "cyan" },
    { label: "Unread", value: String(STATUS.unreadMessages), tone: "blue" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {mounted && <OperationBackground on={ws.bg.on} colors={ws.bg.colors} />}
      {/* ── Banner ─────────────────────────────────────────────────────── */}
      <div className="rise relative overflow-hidden rounded-[2rem] border border-white/10">
        <div className="relative h-44 sm:h-52">
          {ws.banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ws.banner} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover transition-transform duration-700 hover:scale-110" />
          ) : (
            <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(120% 140% at 0% 0%, ${ACCENT[accent].solid ? "" : ""}#11131a 0%, #08090c 70%)` }} />
          )}
          <div aria-hidden className={`pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full ${a.tint} blur-[100px]`} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090c] via-[#08090c]/40 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
          <div className="min-w-0">
            <div className="text-xs text-white/55">Welcome back, {first}</div>
            <h1 className="mt-1 truncate text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">{mounted ? ws.name : "My Operation"}</h1>
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-white/55">
              <span className={`h-1.5 w-1.5 rounded-full ${a.solid} animate-pulse`} /> Live · {ops.length} operations running
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant={arrange ? "solid" : "ghost"} tone={arrange ? accent : "white"} onClick={() => setArrange((v) => !v)} className="!py-2">
              <Icon name="grid" size={15} /> {arrange ? "Done" : "Arrange"}
            </Button>
            <Button variant="ghost" onClick={() => open(<CustomizeSheet ws={ws} onChange={update} />)} className="!py-2">
              <Icon name="sparkles" size={15} /> Customize
            </Button>
          </div>
        </div>
      </div>

      {/* ── Status bar ─────────────────────────────────────────────────── */}
      <div className="rise grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8" style={{ animationDelay: "60ms" }}>
        {statusItems.map((s, i) => (
          <Surface key={s.label} radius="1.1rem" inner="p-3">
            <div className="truncate text-[9px] uppercase tracking-[0.12em] text-white/40">{s.label}</div>
            <div className="mt-0.5 font-mono text-lg font-semibold tracking-tight" style={{ color: bright(themeAt(i)) }}>{s.value}</div>
          </Surface>
        ))}
      </div>

      {/* ── Widgets ────────────────────────────────────────────────────── */}
      <div className="grid grid-flow-row-dense gap-4 lg:grid-cols-2">
        {visible.map((id, i) => {
          const meta = WIDGETS.find((w) => w.id === id)!;
          const collapsed = ws.collapsed.includes(id);
          const span2 = SPAN2.has(id);
          return (
            <section
              key={id}
              draggable={arrange}
              onDragStart={() => setDragId(id)}
              onDragOver={(e) => arrange && e.preventDefault()}
              onDrop={() => { if (arrange && dragId) reorder(dragId, id); setDragId(null); }}
              style={{ animationDelay: `${120 + i * 30}ms` }}
              className={`rise glass rounded-3xl border p-5 ${span2 ? "lg:col-span-2" : ""} ${arrange ? "cursor-grab border-dashed border-white/25 active:cursor-grabbing" : "border-white/10"}`}
            >
              <div className="mb-4 flex items-center gap-2.5">
                {arrange && <Icon name="menu" size={15} className="text-white/30" />}
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${a.tint} ${a.text}`}><Icon name={meta.icon as IconName} size={15} /></span>
                <h2 className="text-sm font-semibold tracking-tight text-white">{meta.title}</h2>
                <div className="ml-auto flex items-center gap-1">
                  {arrange && (
                    <button onClick={() => hide(id)} aria-label="Hide" className="flex h-7 w-7 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/8 hover:text-urgent-red">
                      <Icon name="x" size={14} />
                    </button>
                  )}
                  <button onClick={() => toggleCollapse(id)} aria-label="Collapse" className="flex h-7 w-7 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/8 hover:text-white">
                    <Icon name="chevron" size={15} className={collapsed ? "" : "rotate-90"} />
                  </button>
                </div>
              </div>
              {!collapsed && content(id)}
            </section>
          );
        })}
      </div>
    </div>
  );
}
