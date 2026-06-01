"use client";

import { useMemo, useState } from "react";
import { useClient } from "@/components/client/client-context";
import { useLocalState } from "@/components/client/use-local-state";
import {
  SectionTitle,
  Panel,
  MetricCard,
  StatusBadge,
  FeatureTag,
  DemoModeNotice,
} from "@/components/client/ui";
import { Button } from "@/components/dashboard/ui";
import { Icon } from "@/components/dashboard/icons";
import { CLIENT_KEYS } from "@/lib/client/config";
import { MOCK_JOBS, JOB_CATEGORIES, type Job, type JobStatus } from "@/lib/client/mock";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type FilterKey = "all" | "active" | "draft" | "completed";

const STATUS_TONE: Record<JobStatus, "green" | "gold" | "blue" | "gray" | "red"> = {
  active: "green",
  draft: "gold",
  completed: "blue",
  paused: "gray",
  closed: "red",
};

const STATUS_LABEL: Record<JobStatus, string> = {
  active: "Active",
  draft: "Draft",
  completed: "Completed",
  paused: "Paused",
  closed: "Closed",
};

const MODES: Job["mode"][] = ["Remote", "On-site", "Hybrid"];
const EXPERIENCE_LEVELS = ["Entry", "Intermediate", "Senior", "Expert"] as const;
const PROJECT_TYPES = ["One-off", "Campaign", "Retainer", "Ongoing"] as const;

function formatDeadline(iso: string): string {
  // Static parse of a YYYY-MM-DD string — no Date.now / locale-time, hydration safe.
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!m || !d) return iso;
  return `${months[m - 1]} ${d}, ${parts[0]}`;
}

/* -------------------------------------------------------------------------- */
/*  Create / edit form                                                         */
/* -------------------------------------------------------------------------- */

type FormState = {
  title: string;
  category: string;
  projectType: string;
  budget: string;
  deadline: string;
  location: string;
  mode: Job["mode"];
  description: string;
  deliverables: string;
  experience: string;
  visibility: Job["visibility"];
};

const EMPTY_FORM: FormState = {
  title: "",
  category: JOB_CATEGORIES[0],
  projectType: PROJECT_TYPES[0],
  budget: "",
  deadline: "",
  location: "",
  mode: "On-site",
  description: "",
  deliverables: "",
  experience: EXPERIENCE_LEVELS[1],
  visibility: "Standard",
};

function fieldClasses(): string {
  return "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-grid-blue/50 focus:bg-white/[0.06]";
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-white/50">
        {label}
        {hint}
      </span>
      {children}
    </label>
  );
}

function CreateJobForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (form: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const valid = form.title.trim().length > 0;

  return (
    <Panel className="border-grid-blue/20">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSubmit(form);
        }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight text-white">Create a new job</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close form"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Job title">
              <input
                className={fieldClasses()}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Hotel launch — twilight photography"
              />
            </Field>
          </div>

          <Field label="Category">
            <select
              className={fieldClasses()}
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {JOB_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#0c1117]">
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Project type">
            <select
              className={fieldClasses()}
              value={form.projectType}
              onChange={(e) => set("projectType", e.target.value)}
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t} className="bg-[#0c1117]">
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Budget">
            <input
              className={fieldClasses()}
              value={form.budget}
              onChange={(e) => set("budget", e.target.value)}
              placeholder="e.g. $6,500"
            />
          </Field>

          <Field label="Deadline">
            <input
              type="date"
              className={fieldClasses()}
              value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
          </Field>

          <Field label="Location">
            <input
              className={fieldClasses()}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Oslo, NO"
            />
          </Field>

          <Field label="Mode">
            <select
              className={fieldClasses()}
              value={form.mode}
              onChange={(e) => set("mode", e.target.value as Job["mode"])}
            >
              {MODES.map((m) => (
                <option key={m} value={m} className="bg-[#0c1117]">
                  {m}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Experience level">
            <select
              className={fieldClasses()}
              value={form.experience}
              onChange={(e) => set("experience", e.target.value)}
            >
              {EXPERIENCE_LEVELS.map((x) => (
                <option key={x} value={x} className="bg-[#0c1117]">
                  {x}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Visibility"
            hint={<FeatureTag feature="enhanced-job-visibility" />}
          >
            <select
              className={fieldClasses()}
              value={form.visibility}
              onChange={(e) => set("visibility", e.target.value as Job["visibility"])}
            >
              <option value="Standard" className="bg-[#0c1117]">
                Standard
              </option>
              <option value="Enhanced" className="bg-[#0c1117]">
                Enhanced
              </option>
            </select>
            <span className="mt-1.5 block text-[11px] text-white/40">
              Enhanced placement is an Enterprise feature.
            </span>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea
                className={`${fieldClasses()} min-h-[88px] resize-y`}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What's the brief? Scope, deliverables, tone…"
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Deliverables">
              <textarea
                className={`${fieldClasses()} min-h-[64px] resize-y`}
                value={form.deliverables}
                onChange={(e) => set("deliverables", e.target.value)}
                placeholder="e.g. 12 edited stills, 3 vertical reels, RAW handover"
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button tone="white" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button tone="blue" type="submit" disabled={!valid}>
            Publish job
          </Button>
        </div>
      </form>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Job card                                                                   */
/* -------------------------------------------------------------------------- */

function JobMeta({ icon, children }: { icon: React.ComponentProps<typeof Icon>["name"]; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-white/55">
      <Icon name={icon} size={13} className="text-white/40" />
      {children}
    </span>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  tone = "neutral",
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  onClick: () => void;
  tone?: "neutral" | "danger";
}) {
  const toneCls =
    tone === "danger"
      ? "text-urgent-red/80 hover:bg-urgent-red/10 hover:text-urgent-red"
      : "text-white/65 hover:bg-white/10 hover:text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium transition-colors ${toneCls}`}
    >
      <Icon name={icon} size={13} />
      {label}
    </button>
  );
}

function JobCard({
  job,
  onEdit,
  onDuplicate,
  onPause,
  onClose,
  onDelete,
  isEditing,
  onSaveEdit,
  onCancelEdit,
}: {
  job: Job;
  onEdit: () => void;
  onDuplicate: () => void;
  onPause: () => void;
  onClose: () => void;
  onDelete: () => void;
  isEditing: boolean;
  onSaveEdit: (title: string, budget: string) => void;
  onCancelEdit: () => void;
}) {
  const [draftTitle, setDraftTitle] = useState(job.title);
  const [draftBudget, setDraftBudget] = useState(job.budget);

  return (
    <Panel className="transition-colors hover:border-white/20">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-white/45">
                    Title
                  </span>
                  <input
                    className={fieldClasses()}
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-white/45">
                    Budget
                  </span>
                  <input
                    className={`${fieldClasses()} sm:w-36`}
                    value={draftBudget}
                    onChange={(e) => setDraftBudget(e.target.value)}
                  />
                </label>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-base font-semibold tracking-tight text-white">{job.title}</h3>
                  <StatusBadge label={STATUS_LABEL[job.status]} tone={STATUS_TONE[job.status]} />
                  {job.visibility === "Enhanced" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-grid-blue/15 px-2.5 py-1 text-[11px] font-medium text-aerial-cyan">
                      <Icon name="sparkles" size={11} />
                      Enhanced
                      <FeatureTag feature="enhanced-job-visibility" />
                    </span>
                  )}
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{job.description}</p>
              </>
            )}
          </div>
          {!isEditing && (
            <div className="shrink-0 text-right">
              <div className="text-lg font-semibold tracking-tight text-escrow-green">{job.budget}</div>
              <div className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-white/40">{job.category}</div>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <JobMeta icon="users">
              <span className="font-medium text-white/75">{job.applicants}</span> applicants
            </JobMeta>
            <JobMeta icon="calendar">{formatDeadline(job.deadline)}</JobMeta>
            <JobMeta icon="pin">{job.location}</JobMeta>
            <JobMeta icon="globe">{job.mode}</JobMeta>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-white/8 pt-4">
          {isEditing ? (
            <>
              <Button tone="blue" onClick={() => onSaveEdit(draftTitle, draftBudget)}>
                Save changes
              </Button>
              <Button tone="white" variant="ghost" onClick={onCancelEdit}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <ActionButton icon="file" label="Edit" onClick={onEdit} />
              <ActionButton icon="layout" label="Duplicate" onClick={onDuplicate} />
              {job.status !== "paused" && job.status !== "closed" && job.status !== "completed" && (
                <ActionButton icon="clock" label="Pause" onClick={onPause} />
              )}
              {job.status === "paused" && <ActionButton icon="play" label="Reactivate" onClick={onPause} />}
              {job.status !== "closed" && job.status !== "completed" && (
                <ActionButton icon="lock" label="Close" onClick={onClose} />
              )}
              <ActionButton icon="x" label="Delete" tone="danger" onClick={onDelete} />
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function JobsPage() {
  const { toast } = useClient();
  const [jobs, setJobs] = useLocalState<Job[]>(CLIENT_KEYS.jobs, MOCK_JOBS);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    return {
      all: jobs.length,
      active: jobs.filter((j) => j.status === "active").length,
      draft: jobs.filter((j) => j.status === "draft").length,
      completed: jobs.filter((j) => j.status === "completed").length,
    };
  }, [jobs]);

  const totalApplicants = useMemo(() => jobs.reduce((sum, j) => sum + j.applicants, 0), [jobs]);

  const visibleJobs = useMemo(() => {
    if (filter === "all") return jobs;
    return jobs.filter((j) => j.status === filter);
  }, [jobs, filter]);

  const tabs: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "active", label: "Active", count: counts.active },
    { key: "draft", label: "Draft", count: counts.draft },
    { key: "completed", label: "Completed", count: counts.completed },
  ];

  /* ---- handlers (time/random only inside handlers) ---- */

  const handleCreate = (form: FormState) => {
    const newJob: Job = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      category: form.category,
      status: "active",
      applicants: 0,
      budget: form.budget.trim() || "TBD",
      deadline: form.deadline || "—",
      location: form.location.trim() || (form.mode === "Remote" ? "Remote" : "TBD"),
      mode: form.mode,
      visibility: form.visibility,
      description:
        form.description.trim() ||
        `${form.projectType} · ${form.experience} level${form.deliverables.trim() ? ` · ${form.deliverables.trim()}` : ""}`,
    };
    setJobs((prev) => [newJob, ...prev]);
    setShowForm(false);
    setFilter("all");
    toast("Job created");
  };

  const setStatus = (id: string, status: JobStatus, message: string) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));
    toast(message);
  };

  const handleDuplicate = (job: Job) => {
    const copy: Job = {
      ...job,
      id: crypto.randomUUID(),
      title: `${job.title} (copy)`,
      status: "draft",
      applicants: 0,
    };
    setJobs((prev) => [copy, ...prev]);
    toast("Job duplicated");
  };

  const handleDelete = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    if (editingId === id) setEditingId(null);
    toast("Job deleted");
  };

  const handleSaveEdit = (id: string, title: string, budget: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id ? { ...j, title: title.trim() || j.title, budget: budget.trim() || j.budget } : j,
      ),
    );
    setEditingId(null);
    toast("Job updated");
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <SectionTitle
        title="Jobs"
        subtitle="Post briefs, track applicants and manage every open role across your creative pipeline."
        action={
          <div className="flex items-center gap-3">
            <DemoModeNotice />
            <Button
              tone="blue"
              onClick={() => {
                setShowForm((s) => !s);
                if (editingId) setEditingId(null);
              }}
            >
              <Icon name="plus" size={15} />
              {showForm ? "Hide form" : "Create new job"}
            </Button>
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Open jobs" value={String(counts.active)} sub="currently active" icon="briefcase" accent="text-escrow-green" />
        <MetricCard label="Total applicants" value={String(totalApplicants)} sub="across all jobs" icon="users" />
        <MetricCard label="Drafts" value={String(counts.draft)} sub="not yet published" icon="file" accent="text-review-gold" />
        <MetricCard label="Completed" value={String(counts.completed)} sub="delivered" icon="check" accent="text-aerial-cyan" />
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mt-6">
          <CreateJobForm onCancel={() => setShowForm(false)} onSubmit={handleCreate} />
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 overflow-x-auto">
        <div className="flex min-w-max items-center gap-2">
          {tabs.map((t) => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-grid-blue/40 bg-grid-blue/15 text-aerial-cyan"
                    : "border-white/10 text-white/60 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                    active ? "bg-grid-blue/25 text-aerial-cyan" : "bg-white/10 text-white/55"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Job list */}
      <div className="mt-5 flex flex-col gap-4">
        {visibleJobs.length === 0 ? (
          <Panel className="flex flex-col items-center justify-center py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-white/50">
              <Icon name="briefcase" size={24} />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-white">No jobs here yet</h3>
            <p className="mt-2 max-w-sm text-sm text-white/55">
              {filter === "all"
                ? "Create your first brief to start receiving applicants."
                : `You have no ${filter} jobs. Try another filter or post a new one.`}
            </p>
            <div className="mt-5">
              <Button
                tone="blue"
                onClick={() => {
                  setShowForm(true);
                  setEditingId(null);
                }}
              >
                <Icon name="plus" size={15} />
                Create new job
              </Button>
            </div>
          </Panel>
        ) : (
          visibleJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isEditing={editingId === job.id}
              onEdit={() => {
                setEditingId(job.id);
                setShowForm(false);
              }}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={(title, budget) => handleSaveEdit(job.id, title, budget)}
              onDuplicate={() => handleDuplicate(job)}
              onPause={() =>
                job.status === "paused"
                  ? setStatus(job.id, "active", "Job reactivated")
                  : setStatus(job.id, "paused", "Job paused")
              }
              onClose={() => setStatus(job.id, "closed", "Job closed")}
              onDelete={() => handleDelete(job.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
