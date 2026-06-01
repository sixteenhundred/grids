"use client";

import { useMemo, useState, type ReactNode } from "react";
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
import { Icon, type IconName } from "@/components/dashboard/icons";
import { CLIENT_KEYS } from "@/lib/client/config";
import {
  MOCK_APPROVALS,
  MOCK_PROJECTS,
  MOCK_TEAM,
  type Approval,
  type ApprovalStatus,
} from "@/lib/client/mock";

/* -------------------------------------------------------------------------- */
/*  Constants + helpers                                                        */
/* -------------------------------------------------------------------------- */

type FilterKey = "all" | ApprovalStatus;

const STATUS_LABEL: Record<ApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  revision: "Revision requested",
  rejected: "Rejected",
};

const STATUS_TONE: Record<ApprovalStatus, "gold" | "green" | "blue" | "red"> = {
  pending: "gold",
  approved: "green",
  revision: "blue",
  rejected: "red",
};

const STATUS_ICON: Record<ApprovalStatus, IconName> = {
  pending: "clock",
  approved: "verified",
  revision: "comment",
  rejected: "x",
};

const PREVIEW_GRADIENTS: string[] = [
  "linear-gradient(150deg,#13294b,#0a0c12)",
  "linear-gradient(150deg,#0f3d2e,#08100f)",
  "linear-gradient(150deg,#3a2a4a,#0d0a12)",
  "linear-gradient(150deg,#163a3a,#08100f)",
  "linear-gradient(150deg,#4a3320,#0f0d08)",
];

const PROJECT_NAMES: string[] = MOCK_PROJECTS.map((p) => p.name);
const TEAM_NAMES: string[] = MOCK_TEAM.map((m) => m.name);

const TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "revision", label: "Revisions" },
  { key: "rejected", label: "Rejected" },
];

function formatDeadline(iso: string): string {
  // Static parse of YYYY-MM-DD — no Date.now / locale-time, hydration safe.
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!m || !d) return iso;
  return `${months[m - 1]} ${d}`;
}

// Stable per-card gradient derived from the id (no randomness at render).
function gradientFor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return PREVIEW_GRADIENTS[sum % PREVIEW_GRADIENTS.length];
}

function nextReviewer(current: string): string {
  if (TEAM_NAMES.length === 0) return current;
  const idx = TEAM_NAMES.indexOf(current);
  return TEAM_NAMES[(idx + 1) % TEAM_NAMES.length];
}

function fieldClasses(): string {
  return "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-grid-blue/50 focus:bg-white/[0.06]";
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-white/50">{label}</span>
      {children}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*  Create workflow form                                                       */
/* -------------------------------------------------------------------------- */

type FormState = {
  title: string;
  project: string;
  reviewer: string;
  deadline: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  project: PROJECT_NAMES[0] ?? "",
  reviewer: TEAM_NAMES[0] ?? "",
  deadline: "",
};

function CreateWorkflowForm({
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
          <h3 className="text-lg font-semibold tracking-tight text-white">Create an approval workflow</h3>
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
            <Field label="What needs approval">
              <input
                className={fieldClasses()}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Hotel twilight — final selects"
              />
            </Field>
          </div>

          <Field label="Project">
            <select
              className={fieldClasses()}
              value={form.project}
              onChange={(e) => set("project", e.target.value)}
            >
              {PROJECT_NAMES.map((p) => (
                <option key={p} value={p} className="bg-[#0c1117]">
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Reviewer">
            <select
              className={fieldClasses()}
              value={form.reviewer}
              onChange={(e) => set("reviewer", e.target.value)}
            >
              {TEAM_NAMES.map((n) => (
                <option key={n} value={n} className="bg-[#0c1117]">
                  {n}
                </option>
              ))}
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Deadline">
              <input
                type="date"
                className={fieldClasses()}
                value={form.deadline}
                onChange={(e) => set("deadline", e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button tone="white" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button tone="blue" type="submit" disabled={!valid}>
            Create workflow
          </Button>
        </div>
      </form>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Approval card                                                              */
/* -------------------------------------------------------------------------- */

function CardAction({
  icon,
  label,
  onClick,
  tone = "neutral",
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  tone?: "neutral" | "good" | "danger";
}) {
  const toneCls =
    tone === "danger"
      ? "text-urgent-red/80 hover:bg-urgent-red/10 hover:text-urgent-red"
      : tone === "good"
        ? "text-escrow-green/85 hover:bg-escrow-green/10 hover:text-escrow-green"
        : "text-white/65 hover:bg-white/10 hover:text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1.5 text-[11px] font-medium transition-colors ${toneCls}`}
    >
      <Icon name={icon} size={12} />
      {label}
    </button>
  );
}

function CardMeta({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-white/55">
      <Icon name={icon} size={12} className="text-white/40" />
      {children}
    </span>
  );
}

function ApprovalCard({
  approval,
  onApprove,
  onRequestRevision,
  onReject,
  onAssignReviewer,
  onAddComment,
}: {
  approval: Approval;
  onApprove: () => void;
  onRequestRevision: () => void;
  onReject: () => void;
  onAssignReviewer: () => void;
  onAddComment: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");

  const submitComment = () => {
    const text = draft.trim();
    if (!text) return;
    onAddComment(text);
    setDraft("");
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] transition-colors hover:border-white/20">
      {/* File preview placeholder */}
      <div className="relative h-36 w-full" style={{ background: gradientFor(approval.id) }}>
        <span className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 border-l border-t border-white/25" />
        <span className="pointer-events-none absolute bottom-3 right-3 h-3.5 w-3.5 border-b border-r border-white/25" />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <span className="absolute left-3 top-3">
          <StatusBadge label={STATUS_LABEL[approval.status]} tone={STATUS_TONE[approval.status]} />
        </span>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-white/75">
          <Icon name={STATUS_ICON[approval.status]} size={13} />
          Asset preview
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h4 className="text-sm font-semibold leading-snug tracking-tight text-white">{approval.title}</h4>

        <div className="mt-3 flex flex-col gap-1.5">
          <CardMeta icon="kanban">{approval.project}</CardMeta>
          <CardMeta icon="user">
            Reviewer: <span className="font-medium text-white/75">{approval.reviewer}</span>
          </CardMeta>
          <CardMeta icon="calendar">Deadline {formatDeadline(approval.deadline)}</CardMeta>
        </div>

        {/* Comment thread */}
        <div className="mt-4 border-t border-white/8 pt-3">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-white/45">
            <Icon name="comment" size={12} />
            Comments
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/55">{approval.comments.length}</span>
          </div>

          {approval.comments.length === 0 ? (
            <p className="text-[11px] italic text-white/35">No comments yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {approval.comments.map((c, i) => (
                <li key={i} className="rounded-xl bg-white/[0.04] px-3 py-2">
                  <span className="block text-[11px] font-semibold text-white/80">{c.author}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-white/65">{c.text}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Add comment */}
          <div className="mt-2.5 flex items-center gap-2">
            <input
              className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[12px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-grid-blue/50 focus:bg-white/[0.06]"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitComment();
                }
              }}
              placeholder="Add a comment…"
            />
            <button
              type="button"
              onClick={submitComment}
              disabled={draft.trim().length === 0}
              aria-label="Add comment"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-grid-blue/20 text-aerial-cyan transition-colors hover:bg-grid-blue/30 disabled:opacity-40"
            >
              <Icon name="send" size={14} />
            </button>
          </div>
        </div>

        {/* Status actions */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-white/8 pt-3">
          {approval.status !== "approved" && (
            <CardAction icon="check" label="Approve" tone="good" onClick={onApprove} />
          )}
          {approval.status !== "revision" && (
            <CardAction icon="comment" label="Request revision" onClick={onRequestRevision} />
          )}
          {approval.status !== "rejected" && (
            <CardAction icon="x" label="Reject" tone="danger" onClick={onReject} />
          )}
          <CardAction icon="users" label="Assign reviewer" onClick={onAssignReviewer} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ApprovalWorkflowsPage() {
  const { toast, company } = useClient();
  const [approvals, setApprovals] = useLocalState<Approval[]>(CLIENT_KEYS.approvals, MOCK_APPROVALS);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [showForm, setShowForm] = useState(false);

  const counts = useMemo(
    () => ({
      pending: approvals.filter((a) => a.status === "pending").length,
      approved: approvals.filter((a) => a.status === "approved").length,
      revision: approvals.filter((a) => a.status === "revision").length,
      rejected: approvals.filter((a) => a.status === "rejected").length,
    }),
    [approvals],
  );

  const tabCount = (key: FilterKey): number =>
    key === "all" ? approvals.length : approvals.filter((a) => a.status === key).length;

  const visible = useMemo(
    () => (filter === "all" ? approvals : approvals.filter((a) => a.status === filter)),
    [approvals, filter],
  );

  /* ---- handlers (random ids only inside handlers) ---- */

  const setStatus = (id: string, status: ApprovalStatus, message: string) => {
    setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    toast(message);
  };

  const handleAddComment = (id: string, text: string) => {
    const author = company.name || "Reviewer";
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, comments: [...a.comments, { author, text }] } : a)),
    );
    toast("Comment added");
  };

  const handleAssignReviewer = (id: string) => {
    let name = "";
    setApprovals((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        name = nextReviewer(a.reviewer);
        return { ...a, reviewer: name };
      }),
    );
    toast(`Reviewer set to ${name}`);
  };

  const handleCreate = (form: FormState) => {
    const newApproval: Approval = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      project: form.project || PROJECT_NAMES[0] || "—",
      reviewer: form.reviewer || TEAM_NAMES[0] || "Unassigned",
      deadline: form.deadline || "—",
      status: "pending",
      comments: [],
    };
    setApprovals((prev) => [newApproval, ...prev]);
    setShowForm(false);
    setFilter("all");
    toast("Workflow created");
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <SectionTitle
        title="Approval workflows"
        subtitle="Route creative deliverables through structured review — approve, request revisions or reject, with a full comment trail on every asset."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <DemoModeNotice />
            <FeatureTag feature="approval-workflows" />
            <Button tone="blue" onClick={() => setShowForm((s) => !s)}>
              <Icon name="plus" size={15} />
              {showForm ? "Hide form" : "Create workflow"}
            </Button>
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Pending" value={String(counts.pending)} sub="awaiting review" icon="clock" accent="text-review-gold" />
        <MetricCard label="Approved" value={String(counts.approved)} sub="signed off" icon="verified" accent="text-escrow-green" />
        <MetricCard label="Revisions" value={String(counts.revision)} sub="changes requested" icon="comment" accent="text-aerial-cyan" />
        <MetricCard label="Rejected" value={String(counts.rejected)} sub="not approved" icon="x" accent="text-urgent-red" />
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mt-6">
          <CreateWorkflowForm onCancel={() => setShowForm(false)} onSubmit={handleCreate} />
        </div>
      )}

      {/* Filter tabs */}
      <div className="mt-6 overflow-x-auto pb-1">
        <div className="flex min-w-max items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {TABS.map((t) => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-grid-blue/20 text-aerial-cyan" : "text-white/55 hover:text-white"
                }`}
              >
                {t.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active ? "bg-white/15 text-white/80" : "bg-white/10 text-white/45"}`}>
                  {tabCount(t.key)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards grid */}
      <div className="mt-5">
        {visible.length === 0 ? (
          <Panel className="flex flex-col items-center justify-center py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-grid-blue/15 text-aerial-cyan ring-1 ring-grid-blue/25">
              <Icon name="verified" size={24} />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-white">
              {filter === "all" ? "No approvals yet" : `Nothing ${STATUS_LABEL[filter as ApprovalStatus].toLowerCase()}`}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-white/55">
              {filter === "all"
                ? "Create your first approval workflow to start routing deliverables for review."
                : "Try a different filter, or create a new workflow."}
            </p>
            <div className="mt-5">
              <Button tone="blue" onClick={() => setShowForm(true)}>
                <Icon name="plus" size={15} />
                Create workflow
              </Button>
            </div>
          </Panel>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onApprove={() => setStatus(approval.id, "approved", "Approved")}
                onRequestRevision={() => setStatus(approval.id, "revision", "Revision requested")}
                onReject={() => setStatus(approval.id, "rejected", "Rejected")}
                onAssignReviewer={() => handleAssignReviewer(approval.id)}
                onAddComment={(text) => handleAddComment(approval.id, text)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
