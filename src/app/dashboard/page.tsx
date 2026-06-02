"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useRole } from "@/components/dashboard/role-context";
import { useSheet } from "@/components/dashboard/sheet";
import { UploadSheet, PostJobSheet } from "@/components/dashboard/sheets";
import { MetricCard, SectionHeader, Button, IconTile, Surface, Icon } from "@/components/dashboard/ui";
import { FeaturedCreativeCard, JobRow, PostCard, ProjectCard } from "@/components/dashboard/cards";
import { JOBS, POSTS, PROJECTS, METRICS, money, type Creative } from "@/lib/grid-data";
import { listCreators } from "@/lib/profile-actions";

export default function DashboardHome() {
  const { role } = useRole();
  const { open } = useSheet();
  const { data } = useSession();
  const first = data?.user?.name?.split(" ")[0] ?? (role === "client" ? "there" : "creator");
  const [featured, setFeatured] = useState<Creative[]>([]);

  useEffect(() => {
    listCreators().then((list) => setFeatured(list.slice(0, 8))).catch(() => setFeatured([]));
  }, []);

  return (
    <div className="flex flex-col gap-10">
      {/* Greeting + escrow callout */}
      <section className="rise">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-white/50">Welcome back</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">{first}.</h1>
            <p className="mt-2 max-w-md text-sm text-white/55">
              {role === "client"
                ? "Find verified visual talent, post jobs and track every booking — protected by Grid Escrow."
                : "Your bookings, jobs and tools in one place. Get discovered, get booked, get paid."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {role === "client" ? (
              <>
                <Button tone="green" arrow href="/dashboard/browse">
                  Hire a creative
                </Button>
                <Button variant="ghost" arrow onClick={() => open(<PostJobSheet />)}>
                  Post a job
                </Button>
              </>
            ) : (
              <>
                <Button arrow onClick={() => open(<UploadSheet />)}>
                  Add to portfolio
                </Button>
                <Button variant="ghost" arrow href="/dashboard/jobs">
                  Browse jobs
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="rise grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" style={{ animationDelay: "60ms" }}>
        <MetricCard label="In escrow" value={money(METRICS.inEscrow)} tone="escrow" sub="held, protected" />
        {role === "client" ? (
          <>
            <MetricCard label="Active projects" value={String(PROJECTS.length)} />
            <MetricCard label="Total spent" value={money(METRICS.totalSpent)} />
            <MetricCard label="On-time payments" value="100%" tone="escrow" />
          </>
        ) : (
          <>
            <MetricCard label="This month" value={money(METRICS.thisMonth)} />
            <MetricCard label="Active projects" value={String(PROJECTS.length)} tone="cyan" />
            <MetricCard label="Avg rating" value="4.9 ★" tone="gold" />
          </>
        )}
      </section>

      {/* Featured creatives */}
      {featured.length > 0 && (
        <section className="rise" style={{ animationDelay: "120ms" }}>
          <SectionHeader title="Featured creators" href="/dashboard/browse" />
          <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 no-scrollbar">
            {featured.map((c) => (
              <FeaturedCreativeCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      {/* Role-specific blocks */}
      {role === "client" ? (
        <section className="rise" style={{ animationDelay: "180ms" }}>
          <SectionHeader title="Active projects" href="/dashboard/projects" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {PROJECTS.map((p) => (
              <ProjectCard key={p.id} p={p} role="client" />
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="rise" style={{ animationDelay: "180ms" }}>
            <SectionHeader title="Job board" href="/dashboard/jobs" />
            <div className="flex flex-col gap-3">
              {JOBS.slice(0, 3).map((j) => (
                <JobRow key={j.id} job={j} />
              ))}
            </div>
          </section>

          <section className="rise" style={{ animationDelay: "220ms" }}>
            <SectionHeader title="Community" href="/dashboard/community" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {POSTS.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Quick launch */}
      <section className="rise" style={{ animationDelay: "260ms" }}>
        <SectionHeader title="Your tools" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <IconTile icon="kanban" label="Projects" tone="cyan" href="/dashboard/projects" />
          <IconTile icon="file" label="Contracts" tone="blue" href="/dashboard/contracts" />
          <IconTile icon="wallet" label="Finance" tone="escrow" href="/dashboard/finance" />
          <IconTile icon="map" label="Radar" tone="cyan" href="/dashboard/radar" />
          {role === "creator" && (
            <>
              <IconTile icon="sparkles" label="AI Studio" tone="purple" href="/dashboard/studio" />
              <IconTile icon="shop" label="Shop" tone="purple" href="/dashboard/shop" />
              <IconTile icon="school" label="Academy" tone="gold" href="/dashboard/academy" />
              <IconTile icon="users" label="Collab" tone="blue" href="/dashboard/collab" />
            </>
          )}
        </div>
      </section>

      {/* Escrow trust strip */}
      <Surface radius="2rem" inner="p-6 sm:p-8" className="rise" >
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-escrow-green/15 text-escrow-green ring-1 ring-escrow-green/30">
              <Icon name="shield" size={22} />
            </span>
            <div>
              <h3 className="font-semibold text-white">Protected from brief to delivery</h3>
              <p className="mt-1 max-w-xl text-sm text-white/55">
                Grid Escrow holds funds securely before work starts and releases payment after approval. No chasing, no risk on either side.
              </p>
            </div>
          </div>
          <Link href="/dashboard/finance" className="shrink-0 text-sm font-medium text-escrow-green transition-colors hover:text-white">
            View escrow →
          </Link>
        </div>
      </Surface>
    </div>
  );
}
