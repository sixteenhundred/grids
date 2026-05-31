"use client";

import { useMemo, useState } from "react";
import { PageHeader, Surface, Button, Icon } from "@/components/dashboard/ui";
import { PILLARS, CONTENT_IDEAS, type ContentIdea } from "@/lib/createearn";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_IN_MONTH = 30;
const START_OFFSET = 2; // month starts on a Wednesday

function pillarColor(id: string) {
  return PILLARS.find((p) => p.id === id)?.color ?? "#888";
}

function IdeaCard({ idea, onDragStart, compact = false }: { idea: ContentIdea; onDragStart: (e: React.DragEvent) => void; compact?: boolean }) {
  const color = pillarColor(idea.pillar);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`group cursor-grab rounded-xl border border-white/10 bg-white/[0.04] active:cursor-grabbing ${compact ? "px-2 py-1.5" : "p-2.5"}`}
      style={{ boxShadow: `inset 3px 0 0 ${color}` }}
    >
      <div className={`truncate font-medium text-white ${compact ? "text-[11px]" : "text-xs"}`}>{idea.title}</div>
      {!compact && (
        <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-white/45">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /> {PILLARS.find((p) => p.id === idea.pillar)?.label}
        </div>
      )}
    </div>
  );
}

export default function ContentPlannerPage() {
  const [ideas, setIdeas] = useState<ContentIdea[]>(CONTENT_IDEAS);
  const [overDay, setOverDay] = useState<number | null>(null);

  const backlog = ideas.filter((i) => i.day === null);
  const scheduled = ideas.filter((i) => i.day !== null);

  function move(id: string, day: number | null) {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, day } : i)));
  }
  function onDrop(e: React.DragEvent, day: number | null) {
    e.preventDefault();
    const id = e.dataTransfer.getData("id");
    if (id) move(id, day);
    setOverDay(null);
  }

  // Auto-distribute backlog across upcoming open days.
  function generateTimeline() {
    const open = [5, 8, 12, 15, 19, 23, 26];
    let k = 0;
    setIdeas((prev) =>
      prev.map((i) => (i.day === null && k < open.length ? { ...i, day: open[k++] } : i)),
    );
  }

  const pillarCounts = useMemo(
    () => PILLARS.map((p) => ({ ...p, count: ideas.filter((i) => i.pillar === p.id).length })),
    [ideas],
  );
  const progress = Math.round((scheduled.length / ideas.length) * 100);

  return (
    <div className="flex flex-col gap-8">
      <div className="rise flex flex-wrap items-end justify-between gap-4">
        <PageHeader eyebrow="Create & earn" tone="purple" title="Content Planner™" subtitle="Your campaign command center — drag ideas onto the month." />
        <Button tone="purple" arrow onClick={generateTimeline}>
          <Icon name="sparkles" size={15} /> Generate timeline
        </Button>
      </div>

      {/* Campaign timeline strip */}
      <div className="rise" style={{ animationDelay: "60ms" }}>
        <Surface radius="1.5rem" inner="p-5">
          <div className="mb-4 text-[10px] uppercase tracking-[0.16em] text-white/40">Campaign · Azure Spring Launch</div>
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 right-0 top-3 h-px bg-gradient-to-r from-grid-blue/40 via-ai-purple/40 to-escrow-green/40" />
            {[
              { label: "Tease", c: "#0071e3" },
              { label: "Launch", c: "#9a7fe0" },
              { label: "Sustain", c: "#5aa9f5" },
              { label: "Convert", c: "#4fd07a" },
            ].map((ph) => (
              <div key={ph.label} className="relative z-10 flex flex-col items-center gap-2">
                <span className="h-6 w-6 rounded-full ring-4 ring-[#0a0b0e]" style={{ backgroundColor: ph.c, boxShadow: `0 0 16px -2px ${ph.c}` }} />
                <span className="text-xs text-white/60">{ph.label}</span>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      {/* Pillars + deliverable tracker */}
      <div className="rise grid gap-3 lg:grid-cols-3" style={{ animationDelay: "120ms" }}>
        <Surface radius="1.5rem" inner="p-5" className="lg:col-span-2">
          <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-white/40">Content pillars</div>
          <div className="flex flex-wrap gap-2">
            {pillarCounts.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/75">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} /> {p.label}
                <span className="font-mono text-xs text-white/40">{p.count}</span>
              </span>
            ))}
          </div>
        </Surface>
        <Surface radius="1.5rem" inner="p-5">
          <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/40">Deliverables scheduled</div>
          <div className="font-mono text-2xl font-semibold text-white">{scheduled.length}<span className="text-white/35">/{ideas.length}</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-escrow-green transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
        </Surface>
      </div>

      {/* Backlog */}
      <div
        className="rise"
        style={{ animationDelay: "160ms" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDrop(e, null)}
      >
        <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/40">Idea backlog · drag onto a day</div>
        <div className="flex min-h-[3.5rem] flex-wrap gap-2 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-3">
          {backlog.length === 0 ? (
            <span className="px-1 py-2 text-xs text-white/35">All ideas scheduled — drop here to unschedule.</span>
          ) : (
            backlog.map((i) => (
              <div key={i.id} className="w-44">
                <IdeaCard idea={i} onDragStart={(e) => e.dataTransfer.setData("id", i.id)} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="rise" style={{ animationDelay: "200ms" }}>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-1 text-center text-[10px] font-medium uppercase tracking-wider text-white/35">{d}</div>
          ))}
          {Array.from({ length: START_OFFSET }).map((_, i) => (
            <div key={`pad${i}`} />
          ))}
          {Array.from({ length: DAYS_IN_MONTH }).map((_, idx) => {
            const day = idx + 1;
            const dayIdeas = scheduled.filter((i) => i.day === day);
            const isOver = overDay === day;
            return (
              <div
                key={day}
                onDragOver={(e) => { e.preventDefault(); setOverDay(day); }}
                onDragLeave={() => setOverDay((d) => (d === day ? null : d))}
                onDrop={(e) => onDrop(e, day)}
                className={`flex min-h-[5.5rem] flex-col gap-1 rounded-xl border p-1.5 transition-colors ${isOver ? "border-ai-purple/60 bg-ai-purple/[0.08]" : "border-white/8 bg-white/[0.02]"}`}
              >
                <span className="px-1 text-[10px] font-medium text-white/35">{day}</span>
                {dayIdeas.map((i) => (
                  <IdeaCard key={i.id} idea={i} compact onDragStart={(e) => e.dataTransfer.setData("id", i.id)} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
