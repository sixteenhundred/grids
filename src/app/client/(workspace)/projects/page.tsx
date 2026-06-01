"use client";

import { useState } from "react";
import { useClient } from "@/components/client/client-context";
import { useLocalState } from "@/components/client/use-local-state";
import {
  SectionTitle,
  Panel,
  MetricCard,
  StatusBadge,
  ProgressBar,
  FileUploadZone,
  DemoModeNotice,
} from "@/components/client/ui";
import { Button } from "@/components/dashboard/ui";
import { Icon } from "@/components/dashboard/icons";
import { CLIENT_KEYS } from "@/lib/client/config";
import { MOCK_PROJECTS, type Project, type ProjectStatus } from "@/lib/client/mock";

/* -------------------------------------------------------------------------- */
/*  Status helpers                                                             */
/* -------------------------------------------------------------------------- */

type Tone = "green" | "blue" | "cyan" | "gold" | "red" | "gray" | "purple";

const STATUS_META: Record<ProjectStatus, { label: string; tone: Tone; bar: string }> = {
  "in-progress": { label: "In progress", tone: "blue", bar: "bg-grid-blue" },
  review: { label: "In review", tone: "gold", bar: "bg-review-gold" },
  revision: { label: "Revision", tone: "red", bar: "bg-urgent-red" },
  complete: { label: "Complete", tone: "green", bar: "bg-escrow-green" },
};

const PAYMENT_TONE: Record<Project["payment"], Tone> = {
  Funded: "cyan",
  Released: "green",
  Pending: "gold",
};

/** Derive a progress % from the deliverables checklist. */
function progressFromDeliverables(deliverables: Project["deliverables"]): number {
  if (deliverables.length === 0) return 0;
  const done = deliverables.filter((d) => d.done).length;
  return Math.round((done / deliverables.length) * 100);
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ClientProjectsPage() {
  const { toast } = useClient();
  const [projects, setProjects] = useLocalState<Project[]>(CLIENT_KEYS.projects, MOCK_PROJECTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = projects.find((p) => p.id === selectedId) ?? null;

  const active = projects.filter((p) => p.status !== "complete").length;
  const inReview = projects.filter((p) => p.status === "review").length;
  const completed = projects.filter((p) => p.status === "complete").length;
  const avgProgress =
    projects.length === 0
      ? 0
      : Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length);

  /* ----------------------------------------------------------- mutations -- */

  function createProject() {
    const id = crypto.randomUUID();
    const next: Project = {
      id,
      name: "New project brief",
      creative: "Unassigned",
      status: "in-progress",
      progress: 0,
      deadline: "2026-08-01",
      budget: "$3,000",
      payment: "Pending",
      contract: "Draft",
      deliverables: [
        { label: "Kickoff & brief", done: false },
        { label: "Production", done: false },
        { label: "Delivery", done: false },
      ],
    };
    setProjects((prev) => [next, ...prev]);
    setSelectedId(id);
    toast("Project created");
  }

  function markComplete(id: string) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "complete",
              progress: 100,
              payment: "Released",
              deliverables: p.deliverables.map((d) => ({ ...d, done: true })),
            }
          : p,
      ),
    );
    toast("Marked as complete");
  }

  function requestRevision(id: string) {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "revision" } : p)),
    );
    toast("Revision requested");
  }

  function toggleDeliverable(id: string, index: number) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const deliverables = p.deliverables.map((d, i) =>
          i === index ? { ...d, done: !d.done } : d,
        );
        const progress = progressFromDeliverables(deliverables);
        const allDone = progress === 100;
        return {
          ...p,
          deliverables,
          progress,
          status: allDone ? "complete" : p.status === "complete" ? "in-progress" : p.status,
        };
      }),
    );
    toast("Deliverable updated");
  }

  function approveDeliverable(id: string) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextIndex = p.deliverables.findIndex((d) => !d.done);
        if (nextIndex === -1) {
          toast("All deliverables approved");
          return p;
        }
        const deliverables = p.deliverables.map((d, i) =>
          i === nextIndex ? { ...d, done: true } : d,
        );
        const progress = progressFromDeliverables(deliverables);
        return {
          ...p,
          deliverables,
          progress,
          status: progress === 100 ? "complete" : p.status,
        };
      }),
    );
    toast("Deliverable approved");
  }

  function uploadFile() {
    toast("File uploaded");
  }

  /* --------------------------------------------------------------- render -- */

  return (
    <div>
      <SectionTitle
        title="Projects"
        subtitle="Track every active production from brief to delivery — deliverables, payments, contracts and approvals in one place."
        action={
          <div className="flex items-center gap-3">
            <DemoModeNotice className="hidden sm:inline-flex" />
            <Button tone="green" onClick={createProject}>
              <Icon name="plus" size={16} /> Create project
            </Button>
          </div>
        }
      />

      {/* metrics */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Active" value={String(active)} icon="kanban" accent="text-aerial-cyan" />
        <MetricCard label="In review" value={String(inReview)} icon="clock" accent="text-review-gold" />
        <MetricCard label="Completed" value={String(completed)} icon="verified" accent="text-escrow-green" />
        <MetricCard label="Avg. progress" value={`${avgProgress}%`} icon="chart" accent="text-aerial-cyan" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ---------------------------------------------------- project list -- */}
        <div className="flex flex-col gap-4">
          {projects.length === 0 && (
            <Panel className="text-center">
              <p className="text-sm text-white/55">No projects yet. Create your first project to get started.</p>
            </Panel>
          )}
          {projects.map((p) => {
            const meta = STATUS_META[p.status];
            const isOpen = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(isOpen ? null : p.id)}
                className={`w-full rounded-3xl border bg-white/[0.03] p-5 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-300 hover:bg-white/[0.06] ${
                  isOpen ? "border-grid-blue/40 ring-1 ring-grid-blue/30" : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold tracking-tight text-white">{p.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-white/55">
                      <Icon name="user" size={13} className="text-white/40" />
                      {p.creative}
                    </p>
                  </div>
                  <StatusBadge label={meta.label} tone={meta.tone} />
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-white/45">
                    <span>Progress</span>
                    <span className="font-medium text-white/70">{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} tone={meta.bar} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="calendar" size={13} className="text-white/40" /> {p.deadline}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="wallet" size={13} className="text-white/40" /> {p.budget}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="escrow" size={13} className="text-white/40" />
                    <StatusBadge label={p.payment} tone={PAYMENT_TONE[p.payment]} />
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="file" size={13} className="text-white/40" />
                    <StatusBadge label={p.contract} tone={p.contract === "Signed" ? "green" : "gray"} />
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-aerial-cyan">
                  {isOpen ? "Hide details" : "View details"}
                  <Icon name="chevron" size={13} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                </div>
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------- detail panel -- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {selected ? (
            <ProjectDetail
              project={selected}
              onClose={() => setSelectedId(null)}
              onMarkComplete={() => markComplete(selected.id)}
              onRequestRevision={() => requestRevision(selected.id)}
              onToggleDeliverable={(i) => toggleDeliverable(selected.id, i)}
              onApproveDeliverable={() => approveDeliverable(selected.id)}
              onUploadFile={uploadFile}
            />
          ) : (
            <Panel className="flex h-full min-h-[20rem] flex-col items-center justify-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-grid-blue/15 text-aerial-cyan ring-1 ring-grid-blue/25">
                <Icon name="kanban" size={26} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-white">Select a project</h3>
              <p className="mt-2 max-w-xs text-sm text-white/55">
                Open any project to manage its deliverables, files, payment milestones and approval status.
              </p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Detail panel                                                               */
/* -------------------------------------------------------------------------- */

function ProjectDetail({
  project,
  onClose,
  onMarkComplete,
  onRequestRevision,
  onToggleDeliverable,
  onApproveDeliverable,
  onUploadFile,
}: {
  project: Project;
  onClose: () => void;
  onMarkComplete: () => void;
  onRequestRevision: () => void;
  onToggleDeliverable: (index: number) => void;
  onApproveDeliverable: () => void;
  onUploadFile: () => void;
}) {
  const meta = STATUS_META[project.status];
  const doneCount = project.deliverables.filter((d) => d.done).length;
  const allDone = doneCount === project.deliverables.length && project.deliverables.length > 0;

  // Payment milestones derived from contract state — purely presentational demo data.
  const milestones: { label: string; tone: Tone; status: string }[] = [
    { label: "Deposit (50%)", tone: "green", status: "Released" },
    {
      label: "On delivery (50%)",
      tone: project.payment === "Released" ? "green" : "cyan",
      status: project.payment === "Released" ? "Released" : "In escrow",
    },
  ];

  return (
    <Panel>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge label={meta.label} tone={meta.tone} />
            <StatusBadge label={`Contract: ${project.contract}`} tone={project.contract === "Signed" ? "green" : "gray"} />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-white">{project.name}</h2>
          <p className="mt-1 text-sm text-white/55">Creative: {project.creative}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      {/* overview */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Overview icon="calendar" label="Deadline" value={project.deadline} />
        <Overview icon="wallet" label="Budget" value={project.budget} />
        <Overview icon="chart" label="Progress" value={`${project.progress}%`} />
      </div>

      <div className="mt-4">
        <ProgressBar value={project.progress} tone={meta.bar} />
      </div>

      {/* deliverables checklist */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Deliverables</h3>
          <span className="text-xs text-white/45">
            {doneCount}/{project.deliverables.length} done
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {project.deliverables.map((d, i) => (
            <li key={`${d.label}-${i}`}>
              <button
                type="button"
                onClick={() => onToggleDeliverable(i)}
                className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors ${
                    d.done ? "bg-escrow-green text-[#06140c]" : "bg-white/8 text-transparent ring-1 ring-white/15"
                  }`}
                >
                  <Icon name="check" size={12} />
                </span>
                <span className={`text-sm ${d.done ? "text-white/45 line-through" : "text-white/80"}`}>{d.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <Button tone="blue" variant="ghost" full onClick={onApproveDeliverable} disabled={allDone}>
            <Icon name="check" size={15} /> {allDone ? "All deliverables approved" : "Approve next deliverable"}
          </Button>
        </div>
      </div>

      {/* files */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-white">Files</h3>
        <FileUploadZone onAdd={onUploadFile} label="Upload deliverable files" />
      </div>

      {/* payment milestones */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-white">Payment milestones</h3>
        <ul className="divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/8">
          {milestones.map((m) => (
            <li key={m.label} className="flex items-center justify-between gap-3 bg-white/[0.02] px-4 py-3">
              <span className="flex items-center gap-2.5 text-sm text-white/75">
                <Icon name="escrow" size={15} className="text-escrow-green" />
                {m.label}
              </span>
              <StatusBadge label={m.status} tone={m.tone} />
            </li>
          ))}
        </ul>
      </div>

      {/* contract + approval */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/45">
            <Icon name="file" size={14} /> Contract
          </div>
          <div className="mt-2">
            <StatusBadge label={project.contract} tone={project.contract === "Signed" ? "green" : "gray"} />
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/45">
            <Icon name="verified" size={14} /> Approval
          </div>
          <div className="mt-2">
            <StatusBadge
              label={
                project.status === "complete"
                  ? "Approved"
                  : project.status === "revision"
                    ? "Revision requested"
                    : project.status === "review"
                      ? "Awaiting review"
                      : "In progress"
              }
              tone={meta.tone}
            />
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="mt-6 flex flex-wrap gap-3 border-t border-white/8 pt-5">
        <Button tone="green" onClick={onMarkComplete} disabled={project.status === "complete"}>
          <Icon name="check" size={15} /> Mark as complete
        </Button>
        <Button tone="gold" variant="ghost" onClick={onRequestRevision} disabled={project.status === "revision"}>
          <Icon name="arrow" size={15} /> Request revision
        </Button>
        <Button variant="ghost" onClick={onUploadFile}>
          <Icon name="upload" size={15} /> Upload file
        </Button>
      </div>
    </Panel>
  );
}

function Overview({ icon, label, value }: { icon: "calendar" | "wallet" | "chart"; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-white/45">
        <Icon name={icon} size={13} /> {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
