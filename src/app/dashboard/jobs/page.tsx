"use client";

import { useRole } from "@/components/dashboard/role-context";
import { useSheet } from "@/components/dashboard/sheet";
import { PostJobSheet } from "@/components/dashboard/sheets";
import { PageHeader, SectionHeader, Button } from "@/components/dashboard/ui";
import { JobCard } from "@/components/dashboard/cards";
import { JOBS } from "@/lib/grid-data";

export default function JobsPage() {
  const { role } = useRole();
  const { open } = useSheet();

  if (role === "client") {
    return (
      <div className="flex flex-col gap-10">
        <div className="rise">
          <PageHeader
            title="My jobs"
            subtitle="Jobs you’ve posted."
            tone="green"
            action={
              <Button tone="green" arrow onClick={() => open(<PostJobSheet />)}>
                Post a job
              </Button>
            }
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {JOBS.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const urgent = JOBS.filter((j) => j.urgent);
  const rest = JOBS.filter((j) => !j.urgent);

  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader
          eyebrow="Job board · Urgent calls"
          tone="red"
          title="Open jobs posted by clients."
          subtitle="Apply to one-off, urgent and long-term work."
        />
      </div>

      {urgent.length > 0 && (
        <section className="rise" style={{ animationDelay: "60ms" }}>
          <SectionHeader title="Urgent" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {urgent.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      <section className="rise" style={{ animationDelay: "120ms" }}>
        <SectionHeader title="All jobs" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rest.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>
    </div>
  );
}
