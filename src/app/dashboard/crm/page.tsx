"use client";

import { useState } from "react";
import { PageHeader, Surface, Icon } from "@/components/dashboard/ui";
import { LEADS, CRM_STAGES, money, type Lead, type CrmStage } from "@/lib/createearn";

function healthMeta(h: Lead["health"]) {
  if (h === "hot") return { color: "#ff3b30", label: "Hot" };
  if (h === "warm") return { color: "#f5a14f", label: "Warm" };
  return { color: "#8a8f99", label: "Cold" };
}

function DealCard({ lead, onDragStart }: { lead: Lead; onDragStart: (e: React.DragEvent) => void }) {
  const h = healthMeta(lead.health);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="glass glass-hover cursor-grab rounded-2xl border border-white/10 p-3.5 active:cursor-grabbing"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xs font-semibold text-white ring-1 ring-white/10">
          {lead.name.replace(/[^A-Za-z ]/g, "").trim().split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{lead.name}</div>
          <div className="truncate text-[11px] text-white/45">{lead.category}</div>
        </div>
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: h.color }} title={h.label} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-2.5">
        <span className="font-mono text-sm font-semibold text-white">{money(lead.value)}</span>
        <span className="inline-flex items-center gap-1 text-[10px] text-white/40">
          <Icon name="clock" size={11} /> {lead.lastContact}
        </span>
      </div>
    </div>
  );
}

export default function CreativeCrmPage() {
  const [leads, setLeads] = useState<Lead[]>(LEADS);
  const [over, setOver] = useState<CrmStage | null>(null);

  function onDrop(e: React.DragEvent, stage: CrmStage) {
    e.preventDefault();
    const id = e.dataTransfer.getData("id");
    if (id) setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)));
    setOver(null);
  }

  const won = leads.filter((l) => l.stage === "won").reduce((a, l) => a + l.value, 0);
  const pipeline = leads.filter((l) => l.stage !== "won").reduce((a, l) => a + l.value, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <PageHeader eyebrow="Create & earn" tone="green" title="Creative CRM™" subtitle="Your deal wall — drag clients down the pipeline to close." />
      </div>

      <div className="rise grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
        {[
          { label: "Open pipeline", value: money(pipeline), tone: "text-white" },
          { label: "Won", value: money(won), tone: "text-escrow-green" },
          { label: "Deals", value: String(leads.length), tone: "text-white" },
        ].map((s) => (
          <Surface key={s.label} radius="1.25rem" inner="p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">{s.label}</div>
            <div className={`mt-1.5 font-mono text-2xl font-semibold tracking-tight ${s.tone}`}>{s.value}</div>
          </Surface>
        ))}
      </div>

      {/* Pipeline wall */}
      <div className="rise grid gap-3 md:grid-cols-2 xl:grid-cols-4" style={{ animationDelay: "120ms" }}>
        {CRM_STAGES.map((stage) => {
          const items = leads.filter((l) => l.stage === stage.key);
          const total = items.reduce((a, l) => a + l.value, 0);
          const isOver = over === stage.key;
          return (
            <div
              key={stage.key}
              onDragOver={(e) => { e.preventDefault(); setOver(stage.key); }}
              onDragLeave={() => setOver((s) => (s === stage.key ? null : s))}
              onDrop={(e) => onDrop(e, stage.key)}
              className={`flex flex-col gap-2.5 rounded-3xl border p-3 transition-colors ${isOver ? "border-white/25 bg-white/[0.05]" : "border-white/8 bg-white/[0.015]"}`}
            >
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.accent }} /> {stage.label}
                </span>
                <span className="font-mono text-xs text-white/40">{items.length}</span>
              </div>
              <div className="px-1 pb-1 font-mono text-[11px] text-white/35">{money(total)}</div>
              {items.map((l) => (
                <DealCard key={l.id} lead={l} onDragStart={(e) => e.dataTransfer.setData("id", l.id)} />
              ))}
              {items.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 py-6 text-center text-[11px] text-white/30">Drop here</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
