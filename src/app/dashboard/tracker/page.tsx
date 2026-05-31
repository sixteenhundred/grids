"use client";

import { PageHeader, Surface, MediaTile, Avatar, StatusPill, Icon } from "@/components/dashboard/ui";
import { TRACK_STAGES, TRACKED, money, type TrackedProject } from "@/lib/clienthq";

function StageRail({ stage }: { stage: number }) {
  const pct = (stage / (TRACK_STAGES.length - 1)) * 100;
  const delivered = stage >= TRACK_STAGES.length - 1;
  return (
    <div className="relative">
      {/* track */}
      <div className="absolute left-0 right-0 top-[7px] h-0.5 bg-white/10" />
      <div
        className={`absolute left-0 top-[7px] h-0.5 ${delivered ? "bg-escrow-green" : "bg-aerial-cyan"} transition-[width] duration-700`}
        style={{ width: `${pct}%` }}
      />
      <div className="relative flex justify-between">
        {TRACK_STAGES.map((label, i) => {
          const done = i < stage;
          const current = i === stage;
          return (
            <div key={label} className="flex flex-col items-center gap-2" style={{ width: `${100 / TRACK_STAGES.length}%` }}>
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-[#0a0b0e] transition-colors ${
                  done ? "bg-aerial-cyan" : current ? (delivered ? "bg-escrow-green" : "bg-aerial-cyan") : "bg-white/15"
                } ${current && !delivered ? "animate-pulse" : ""}`}
              >
                {done && <Icon name="check" size={9} className="text-[#06121a]" />}
              </span>
              <span className={`text-center text-[10px] ${i <= stage ? "text-white/75" : "text-white/35"}`}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrackerCard({ p }: { p: TrackedProject }) {
  const delivered = p.stage >= TRACK_STAGES.length - 1;
  return (
    <Surface radius="2rem" inner="p-0">
      <div className="flex items-center gap-4 border-b border-white/8 p-5">
        <MediaTile tile={p.tile} className="h-14 w-14 shrink-0" rounded="rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-white">{p.title}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
            <Avatar id={p.creatorId} name={p.creator} size={18} /> {p.creator}
            <span className="text-white/25">·</span> {money(p.value)}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <StatusPill tone={delivered ? "escrow" : "cyan"} live={!delivered}>
            {TRACK_STAGES[p.stage]}
          </StatusPill>
          <div className="mt-1.5 text-[11px] text-white/40">{delivered ? "Delivered" : `ETA ${p.eta}`}</div>
        </div>
      </div>
      <div className="px-6 py-6">
        <StageRail stage={p.stage} />
      </div>
      <div className="flex items-center justify-between border-t border-white/8 px-5 py-3 text-[11px] text-white/40">
        <span className="inline-flex items-center gap-1.5"><Icon name="clock" size={12} /> Updated {p.updated}</span>
        <span className="inline-flex items-center gap-1.5 text-aerial-cyan"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aerial-cyan" /> Live tracking</span>
      </div>
    </Surface>
  );
}

export default function DeliverableTrackerPage() {
  const active = TRACKED.filter((p) => p.stage < TRACK_STAGES.length - 1).length;
  const delivered = TRACKED.filter((p) => p.stage >= TRACK_STAGES.length - 1).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <PageHeader eyebrow="Client HQ" tone="cyan" title="Deliverable Tracker™" subtitle="Track every project in real time — like a shipment, from booked to delivered." />
      </div>

      <div className="rise grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
        {[
          { label: "Active", value: String(active) },
          { label: "Delivered", value: String(delivered) },
          { label: "In production", value: String(TRACKED.filter((p) => p.stage >= 2 && p.stage <= 3).length) },
        ].map((s) => (
          <Surface key={s.label} radius="1.25rem" inner="p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">{s.label}</div>
            <div className="mt-1.5 font-mono text-2xl font-semibold tracking-tight text-white">{s.value}</div>
          </Surface>
        ))}
      </div>

      <div className="rise flex flex-col gap-4" style={{ animationDelay: "120ms" }}>
        {TRACKED.map((p) => (
          <TrackerCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
