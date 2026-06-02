"use client";

import { useEffect, useState } from "react";
import { PageHeader, SectionHeader, Surface, Card, Avatar, Icon } from "@/components/dashboard/ui";
import { JobRow } from "@/components/dashboard/cards";
import { useSheet } from "@/components/dashboard/sheet";
import { ApplyJobSheet, QuickProfileSheet } from "@/components/dashboard/sheets";
import { JOBS, type Creative } from "@/lib/grid-data";
import { listCreators } from "@/lib/profile-actions";

/* Decorative radar pings — positioned over the rings. */
const PINGS = [
  { top: "30%", left: "38%", delay: "0ms" },
  { top: "58%", left: "62%", delay: "400ms" },
  { top: "44%", left: "70%", delay: "900ms" },
  { top: "66%", left: "44%", delay: "1300ms" },
];

export default function RadarPage() {
  const { open } = useSheet();
  const urgent = JOBS.filter((j) => j.urgent);
  const [nearby, setNearby] = useState<Creative[]>([]);

  useEffect(() => {
    listCreators().then((list) => setNearby(list.slice(0, 4))).catch(() => setNearby([]));
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Grid Radar"
        tone="cyan"
        title="Near you, right now."
        subtitle="Creatives, jobs and urgent calls in your area."
      />

      {/* Radar visual */}
      <div className="rise">
        <Surface radius="2rem" inner="relative h-56 sm:h-64 overflow-hidden">
          {/* Concentric rings, centered */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <span className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-aerial-cyan/20 sm:h-48 sm:w-48" />
            <span className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-aerial-cyan/15 sm:h-72 sm:w-72" />
            <span className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-aerial-cyan/10 sm:h-[26rem] sm:w-[26rem]" />
            <span className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-aerial-cyan/[0.06] sm:h-[34rem] sm:w-[34rem]" />
            {/* Center mark */}
            <span className="absolute left-1/2 top-1/2 flex h-3 w-3 -translate-x-1/2 -translate-y-1/2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aerial-cyan opacity-70" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-aerial-cyan" />
            </span>
          </div>

          {/* Pulsing pins scattered across the radar */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {PINGS.map((p, i) => (
              <span key={i} className="absolute flex h-2 w-2" style={{ top: p.top, left: p.left }}>
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aerial-cyan opacity-60"
                  style={{ animationDelay: p.delay }}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-aerial-cyan" />
              </span>
            ))}
          </div>
        </Surface>
      </div>

      {/* Urgent nearby */}
      <div className="rise" style={{ animationDelay: "60ms" }}>
        <SectionHeader title="Urgent nearby" />
        <div className="flex flex-col gap-3">
          {urgent.map((j) => (
            <button key={j.id} type="button" onClick={() => open(<ApplyJobSheet job={j} />)} className="block text-left">
              <JobRow job={j} />
            </button>
          ))}
        </div>
      </div>

      {/* Creatives nearby */}
      <div className="rise" style={{ animationDelay: "120ms" }}>
        <SectionHeader title="Creatives nearby" />
        {nearby.length > 0 ? (
          <div className="flex flex-col gap-3">
            {nearby.map((c) => (
              <Card key={c.id} hover className="p-0">
                <button type="button" onClick={() => open(<QuickProfileSheet creative={c} />)} className="flex w-full items-center gap-4 rounded-[inherit] p-4 text-left">
                  <Avatar id={c.id} name={c.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-white">{c.name}</div>
                    <div className="truncate text-sm text-white/55">{c.city}{c.distanceKm ? ` · ${c.distanceKm} km` : ""}</div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-aerial-cyan">
                    View <Icon name="chevron" size={14} />
                  </span>
                </button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/55">
            No creatives nearby yet.
          </div>
        )}
      </div>
    </div>
  );
}
