"use client";

import { useRole } from "@/components/dashboard/role-context";
import { PageHeader, MetricCard } from "@/components/dashboard/ui";
import { ProjectCard } from "@/components/dashboard/cards";
import { PROJECTS, METRICS, money } from "@/lib/grid-data";

export default function ProjectsPage() {
  const { role } = useRole();

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
        <MetricCard label="Delivered this month" value="2" tone="gold" />
      </div>

      <div className="rise grid gap-4 md:grid-cols-2 xl:grid-cols-3" style={{ animationDelay: "120ms" }}>
        {PROJECTS.map((p) => (
          <ProjectCard key={p.id} p={p} role={role} />
        ))}
      </div>
    </div>
  );
}
