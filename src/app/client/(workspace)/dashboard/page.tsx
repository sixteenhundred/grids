"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { useClient } from "@/components/client/client-context";
import { useLocalState } from "@/components/client/use-local-state";
import {
  SectionTitle,
  Panel,
  MetricCard,
  StatusBadge,
  ProgressBar,
  DemoModeNotice,
} from "@/components/client/ui";
import { Icon } from "@/components/dashboard/icons";
import { Button } from "@/components/dashboard/ui";
import { CLIENT_KEYS } from "@/lib/client/config";
import {
  OVERVIEW_STATS,
  MOCK_PROJECTS,
  MOCK_JOBS,
  MOCK_CHANNELS,
  MOCK_APPROVALS,
  CONCIERGE_MATCHES,
  type Project,
  type ProjectStatus,
  type Job,
  type Channel,
  type Approval,
  type ApprovalStatus,
} from "@/lib/client/mock";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type Tone = "green" | "blue" | "cyan" | "gold" | "red" | "gray" | "purple";

const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: Tone; bar: string }> = {
  "in-progress": { label: "In progress", tone: "blue", bar: "bg-grid-blue" },
  review: { label: "In review", tone: "gold", bar: "bg-review-gold" },
  revision: { label: "Revision", tone: "red", bar: "bg-urgent-red" },
  complete: { label: "Complete", tone: "green", bar: "bg-escrow-green" },
};

const APPROVAL_STATUS: Record<ApprovalStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "gold" },
  approved: { label: "Approved", tone: "green" },
  revision: { label: "Revision", tone: "blue" },
  rejected: { label: "Rejected", tone: "red" },
};

const PAYMENT_TONE: Record<Project["payment"], Tone> = {
  Funded: "blue",
  Released: "green",
  Pending: "gold",
};

/** Days from "today" (2026-06-01 in demo context) to a yyyy-mm-dd date. */
function daysUntil(date: string): number {
  const today = new Date("2026-06-01T00:00:00");
  const target = new Date(`${date}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function deadlineLabel(date: string): { text: string; tone: Tone } {
  const d = daysUntil(date);
  if (d < 0) return { text: `${Math.abs(d)}d overdue`, tone: "red" };
  if (d === 0) return { text: "Due today", tone: "red" };
  if (d <= 3) return { text: `In ${d}d`, tone: "gold" };
  return { text: `In ${d}d`, tone: "cyan" };
}

/* -------------------------------------------------------------------------- */
/*  Small co-located presentational pieces                                     */
/* -------------------------------------------------------------------------- */

function WidgetHeader({ title, icon, href }: { title: string; icon: Parameters<typeof Icon>[0]["name"]; href: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-aerial-cyan">
          <Icon name={icon} size={15} />
        </span>
        {title}
      </h3>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-medium text-aerial-cyan transition-colors hover:text-white"
      >
        View all <Icon name="arrow" size={12} />
      </Link>
    </div>
  );
}

function RowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-white/8 bg-white/[0.02] p-3.5 transition-colors hover:border-white/15 hover:bg-white/[0.05]"
    >
      {children}
    </Link>
  );
}

function EmptyState({ icon, text }: { icon: Parameters<typeof Icon>[0]["name"]; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-white/40">
        <Icon name={icon} size={17} />
      </span>
      <span className="text-xs text-white/45">{text}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

type FlatMessage = { id: string; channel: string; author: string; text: string; time: string };
type Deadline = { id: string; label: string; meta: string; date: string; href: string };

export default function ClientDashboardPage() {
  const { company, toast } = useClient();
  const router = useRouter();

  // Seed demo state from the mock arrays so the dashboard reflects any local edits.
  const [projects] = useLocalState<Project[]>(CLIENT_KEYS.projects, MOCK_PROJECTS);
  const [jobs] = useLocalState<Job[]>(CLIENT_KEYS.jobs, MOCK_JOBS);
  const [channels] = useLocalState<Channel[]>(CLIENT_KEYS.channels, MOCK_CHANNELS);
  const [approvals] = useLocalState<Approval[]>(CLIENT_KEYS.approvals, MOCK_APPROVALS);

  const recentProjects = useMemo(() => projects.slice(0, 4), [projects]);
  const activeJobs = useMemo(() => jobs.filter((j) => j.status === "active"), [jobs]);
  const pendingApprovals = useMemo(() => approvals.filter((a) => a.status === "pending"), [approvals]);

  // Upcoming deadlines derived from projects + active jobs, soonest first.
  const deadlines = useMemo<Deadline[]>(() => {
    const fromProjects: Deadline[] = projects
      .filter((p) => p.status !== "complete")
      .map((p) => ({ id: `prj-${p.id}`, label: p.name, meta: p.creative, date: p.deadline, href: "/client/projects" }));
    const fromJobs: Deadline[] = jobs
      .filter((j) => j.status === "active")
      .map((j) => ({ id: `job-${j.id}`, label: j.title, meta: `${j.applicants} applicants`, date: j.deadline, href: "/client/jobs" }));
    return [...fromProjects, ...fromJobs].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  }, [projects, jobs]);

  // Latest message from each non-empty channel.
  const messages = useMemo<FlatMessage[]>(
    () =>
      channels
        .filter((c) => c.messages.length > 0)
        .map((c) => {
          const last = c.messages[c.messages.length - 1];
          return { id: last.id, channel: c.name, author: last.author, text: last.text, time: last.time };
        })
        .slice(0, 4),
    [channels],
  );

  const filesToReview = pendingApprovals;

  return (
    <div className="space-y-8">
      {/* ----------------------------------------------------------- header -- */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-aerial-cyan ring-1 ring-grid-blue/25">
              Command center
            </span>
            <DemoModeNotice />
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Welcome back, {company.name}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            Here is everything moving across your jobs, projects and creative team today.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            tone="white"
            onClick={() => {
              router.push("/client/jobs");
              toast("Opening new job");
            }}
          >
            <Icon name="plus" size={16} /> Post a job
          </Button>
          <Button variant="ghost" href="/dashboard/browse">
            <Icon name="search" size={16} /> Find creatives
          </Button>
        </div>
      </header>

      {/* --------------------------------------------------- overview cards -- */}
      <section>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {OVERVIEW_STATS.map((stat) => (
            <MetricCard
              key={stat.key}
              label={stat.label}
              value={stat.value}
              sub={stat.sub}
              icon={stat.icon}
              href={stat.href}
            />
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- widgets -- */}
      <section>
        <SectionTitle
          title="Today at a glance"
          subtitle="Live snapshots across every workspace. Tap any card to dive in."
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Recent projects */}
          <Panel className="lg:col-span-2">
            <WidgetHeader title="Recent projects" icon="kanban" href="/client/projects" />
            {recentProjects.length === 0 ? (
              <EmptyState icon="kanban" text="No active projects yet." />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {recentProjects.map((p) => {
                  const s = PROJECT_STATUS[p.status];
                  return (
                    <RowLink key={p.id} href="/client/projects">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white">{p.name}</div>
                          <div className="mt-0.5 truncate text-xs text-white/45">{p.creative}</div>
                        </div>
                        <StatusBadge label={s.label} tone={s.tone} />
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <ProgressBar value={p.progress} tone={s.bar} />
                        <span className="shrink-0 text-xs font-medium text-white/55">{p.progress}%</span>
                      </div>
                    </RowLink>
                  );
                })}
              </div>
            )}
          </Panel>

          {/* Active job posts */}
          <Panel>
            <WidgetHeader title="Active job posts" icon="briefcase" href="/client/jobs" />
            {activeJobs.length === 0 ? (
              <EmptyState icon="briefcase" text="No active job posts." />
            ) : (
              <div className="space-y-2.5">
                {activeJobs.slice(0, 4).map((j) => (
                  <RowLink key={j.id} href="/client/jobs">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-white">{j.title}</div>
                        <div className="mt-0.5 text-xs text-white/45">
                          {j.category} · {j.budget}
                        </div>
                      </div>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-semibold text-aerial-cyan">{j.applicants}</span>
                        <span className="block text-[10px] uppercase tracking-wider text-white/40">applicants</span>
                      </span>
                    </div>
                  </RowLink>
                ))}
              </div>
            )}
          </Panel>

          {/* Recommended creatives */}
          <Panel>
            <WidgetHeader title="Recommended creatives" icon="sparkles" href="/dashboard/browse" />
            <div className="space-y-2.5">
              {CONCIERGE_MATCHES.map((c) => (
                <RowLink key={c.name} href="/dashboard/browse">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-white">{c.name}</div>
                      <div className="mt-0.5 truncate text-xs text-white/45">
                        {c.type} · {c.city}
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="text-xs text-white/45">{c.rate}</span>
                      <StatusBadge label={`${c.score}% match`} tone="green" />
                    </span>
                  </div>
                </RowLink>
              ))}
            </div>
          </Panel>

          {/* Upcoming deadlines */}
          <Panel>
            <WidgetHeader title="Upcoming deadlines" icon="calendar" href="/client/projects" />
            {deadlines.length === 0 ? (
              <EmptyState icon="calendar" text="Nothing due — you're all caught up." />
            ) : (
              <div className="space-y-2.5">
                {deadlines.map((d) => {
                  const dl = deadlineLabel(d.date);
                  return (
                    <RowLink key={d.id} href={d.href}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white">{d.label}</div>
                          <div className="mt-0.5 truncate text-xs text-white/45">{d.meta}</div>
                        </div>
                        <span className="shrink-0 text-right">
                          <StatusBadge label={dl.text} tone={dl.tone} />
                          <span className="mt-1 block text-[10px] text-white/35">{d.date}</span>
                        </span>
                      </div>
                    </RowLink>
                  );
                })}
              </div>
            )}
          </Panel>

          {/* Payment status */}
          <Panel>
            <WidgetHeader title="Payment status" icon="wallet" href="/client/performance" />
            {projects.length === 0 ? (
              <EmptyState icon="wallet" text="No payments to track yet." />
            ) : (
              <div className="space-y-2.5">
                {projects.slice(0, 4).map((p) => (
                  <RowLink key={p.id} href="/client/projects">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-white">{p.name}</div>
                        <div className="mt-0.5 text-xs text-white/45">{p.budget}</div>
                      </div>
                      <StatusBadge label={p.payment} tone={PAYMENT_TONE[p.payment]} />
                    </div>
                  </RowLink>
                ))}
              </div>
            )}
          </Panel>

          {/* Recent messages */}
          <Panel>
            <WidgetHeader title="Recent messages" icon="comment" href="/client/internal-messages" />
            {messages.length === 0 ? (
              <EmptyState icon="comment" text="No messages in your channels." />
            ) : (
              <div className="space-y-2.5">
                {messages.map((m) => (
                  <RowLink key={m.id} href="/client/internal-messages">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-aerial-cyan">#{m.channel}</span>
                      <span className="shrink-0 text-[10px] text-white/35">{m.time}</span>
                    </div>
                    <div className="mt-1.5 text-sm text-white/80">
                      <span className="font-medium text-white">{m.author}:</span>{" "}
                      <span className="line-clamp-1 align-baseline">{m.text}</span>
                    </div>
                  </RowLink>
                ))}
              </div>
            )}
          </Panel>

          {/* Files needing review */}
          <Panel>
            <WidgetHeader title="Files needing review" icon="file" href="/client/approval-workflows" />
            {filesToReview.length === 0 ? (
              <EmptyState icon="check" text="No files waiting on your review." />
            ) : (
              <div className="space-y-2.5">
                {filesToReview.map((a) => {
                  const dl = deadlineLabel(a.deadline);
                  return (
                    <RowLink key={a.id} href="/client/approval-workflows">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white">{a.title}</div>
                          <div className="mt-0.5 truncate text-xs text-white/45">{a.project}</div>
                        </div>
                        <StatusBadge label={dl.text} tone={dl.tone} />
                      </div>
                    </RowLink>
                  );
                })}
              </div>
            )}
          </Panel>

          {/* Approval requests */}
          <Panel className="lg:col-span-2">
            <WidgetHeader title="Approval requests" icon="verified" href="/client/approval-workflows" />
            {approvals.length === 0 ? (
              <EmptyState icon="verified" text="No approval requests right now." />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {approvals.map((a) => {
                  const s = APPROVAL_STATUS[a.status];
                  return (
                    <RowLink key={a.id} href="/client/approval-workflows">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white">{a.title}</div>
                          <div className="mt-0.5 truncate text-xs text-white/45">
                            {a.project} · {a.reviewer}
                          </div>
                        </div>
                        <StatusBadge label={s.label} tone={s.tone} />
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-white/45">
                        <Icon name="comment" size={12} />
                        {a.comments.length} {a.comments.length === 1 ? "comment" : "comments"}
                        <span className="ml-auto text-white/35">Due {a.deadline}</span>
                      </div>
                    </RowLink>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </section>
    </div>
  );
}
