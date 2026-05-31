"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/components/dashboard/role-context";
import { PageHeader, MetricCard, SectionHeader, Card, StatusPill, Icon } from "@/components/dashboard/ui";
import { ProjectCard } from "@/components/dashboard/cards";
import { PROJECTS, METRICS, money } from "@/lib/grid-data";
import { loadDeliveries, formatSize, relativeTime, type Delivery } from "@/lib/transfers";

export default function ProjectsPage() {
  const { role } = useRole();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => setDeliveries(loadDeliveries().filter((d) => d.markedDelivery)), []);

  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader
          eyebrow="Grid Projects"
          tone="cyan"
          title="Projects"
          subtitle="Track every job from planning to delivery."
        />
      </div>

      <div className="rise grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
        <MetricCard label="Active" value={String(PROJECTS.length)} tone="cyan" />
        <MetricCard label="In escrow" value={money(METRICS.inEscrow)} tone="escrow" sub="held, protected" />
        <MetricCard label="Delivered this month" value={String(2 + deliveries.length)} tone="gold" />
      </div>

      <div className="rise grid gap-4 md:grid-cols-2 xl:grid-cols-3" style={{ animationDelay: "120ms" }}>
        {PROJECTS.map((p) => (
          <ProjectCard key={p.id} p={p} role={role} />
        ))}
      </div>

      {/* Deliveries received via Transfer */}
      {deliveries.length > 0 && (
        <div className="rise" style={{ animationDelay: "180ms" }}>
          <SectionHeader title="Deliveries" />
          <div className="flex flex-col gap-3">
            {deliveries.map((d) => (
              <Card key={d.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-escrow-green/12 text-escrow-green ring-1 ring-escrow-green/25">
                      <Icon name="folder" size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{d.projectTitle}</div>
                      <div className="truncate text-xs text-white/45">
                        {role === "client" ? "from creator" : `to ${d.client}`} · {d.files.length} file{d.files.length === 1 ? "" : "s"} · {formatSize(d.files.reduce((a, f) => a + f.size, 0))}
                      </div>
                      {d.note && <p className="mt-1 line-clamp-1 text-xs text-white/55">“{d.note}”</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {d.status === "accepted" ? (
                      <StatusPill tone="escrow">Accepted</StatusPill>
                    ) : (
                      <StatusPill tone="gold" live>Awaiting acceptance</StatusPill>
                    )}
                    <span className="text-[11px] text-white/40">{relativeTime(d.createdAt)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
