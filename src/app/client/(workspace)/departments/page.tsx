"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useClient } from "@/components/client/client-context";
import { useLocalState } from "@/components/client/use-local-state";
import {
  SectionTitle,
  Panel,
  MetricCard,
  StatusBadge,
  ProgressBar,
  FeatureTag,
  DemoModeNotice,
  FeatureGate,
} from "@/components/client/ui";
import { Button } from "@/components/dashboard/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { CLIENT_KEYS } from "@/lib/client/config";
import { MOCK_DEPARTMENTS, type Department } from "@/lib/client/mock";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Parse "$42,000" → 42000. Returns 0 for unparseable strings (hydration safe). */
function parseMoney(s: string): number {
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Parse "120 GB" → 120. */
function parseStorage(s: string): number {
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

/**
 * Derive a simple capacity / utilization figure from member count.
 * Static + deterministic (no random / time) so SSR and client match.
 */
function utilization(members: number): number {
  if (members <= 0) return 0;
  // Each member nudges utilization up, capped at 98%.
  return Math.min(98, 38 + members * 9);
}

function utilizationTone(value: number): string {
  if (value >= 90) return "bg-urgent-red";
  if (value >= 70) return "bg-review-gold";
  return "bg-escrow-green";
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

function ActionButton({
  icon,
  label,
  onClick,
  tone = "neutral",
}: {
  icon: IconName;
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

function StatBlock({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
        <Icon name={icon} size={12} className="text-white/40" />
        {label}
      </div>
      <div className="mt-1.5 text-base font-semibold tracking-tight text-white">{value}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Create department form                                                     */
/* -------------------------------------------------------------------------- */

type CreateForm = { name: string; description: string; lead: string };

const EMPTY_FORM: CreateForm = { name: "", description: "", lead: "" };

function CreateDepartmentForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (form: CreateForm) => void;
}) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const set = <K extends keyof CreateForm>(key: K, value: CreateForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const valid = form.name.trim().length > 0;

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
          <h3 className="text-lg font-semibold tracking-tight text-white">Create a department</h3>
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
          <Field label="Department name">
            <input
              className={fieldClasses()}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Creative Production"
            />
          </Field>
          <Field label="Department lead">
            <input
              className={fieldClasses()}
              value={form.lead}
              onChange={(e) => set("lead", e.target.value)}
              placeholder="e.g. Ingrid Hansen"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea
                className={`${fieldClasses()} min-h-[72px] resize-y`}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What does this team own? Scope, focus, remit…"
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button tone="white" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button tone="blue" type="submit" disabled={!valid}>
            Create department
          </Button>
        </div>
      </form>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Department card                                                            */
/* -------------------------------------------------------------------------- */

function DepartmentCard({
  dept,
  expanded,
  onToggleExpand,
  isEditing,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onAddMember,
  onAssignProject,
  onDelete,
}: {
  dept: Department;
  expanded: boolean;
  onToggleExpand: () => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onSaveEdit: (name: string, lead: string) => void;
  onCancelEdit: () => void;
  onAddMember: () => void;
  onAssignProject: () => void;
  onDelete: () => void;
}) {
  const [draftName, setDraftName] = useState(dept.name);
  const [draftLead, setDraftLead] = useState(dept.lead);

  const util = utilization(dept.members);
  const leadInitials = dept.lead
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <Panel className="flex flex-col gap-4 transition-colors hover:border-white/20">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-white/45">
                  Name
                </span>
                <input className={fieldClasses()} value={draftName} onChange={(e) => setDraftName(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-white/45">
                  Lead
                </span>
                <input className={fieldClasses()} value={draftLead} onChange={(e) => setDraftLead(e.target.value)} />
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-grid-blue/15 text-aerial-cyan ring-1 ring-grid-blue/25">
                <Icon name="building" size={20} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold tracking-tight text-white">{dept.name}</h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-white/55">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[9px] font-semibold text-white/80">
                    {leadInitials || "—"}
                  </span>
                  <span>
                    Led by <span className="font-medium text-white/75">{dept.lead || "Unassigned"}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        {!isEditing && (
          <StatusBadge label={dept.projects > 0 ? "Active" : "Idle"} tone={dept.projects > 0 ? "green" : "gray"} />
        )}
      </div>

      {!isEditing && (
        <>
          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatBlock icon="users" label="Members" value={String(dept.members)} />
            <StatBlock icon="kanban" label="Projects" value={String(dept.projects)} />
            <StatBlock icon="wallet" label="Budget" value={dept.budget} />
            <StatBlock icon="folder" label="Storage" value={dept.storage} />
          </div>

          {/* Performance summary */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium uppercase tracking-[0.12em] text-white/45">Team utilization</span>
              <span className="font-semibold text-white/75">{util}%</span>
            </div>
            <ProgressBar value={util} tone={utilizationTone(util)} />
            <p className="mt-1.5 text-[11px] text-white/40">
              {dept.members === 0
                ? "No members yet — add someone to start tracking capacity."
                : util >= 90
                  ? "Near capacity — consider rebalancing or hiring."
                  : util >= 70
                    ? "Healthy load with room to take on more."
                    : "Plenty of spare capacity for new work."}
            </p>
          </div>

          {/* Expanded detail */}
          {expanded && (
            <div className="grid gap-2.5 rounded-2xl border border-white/8 bg-white/[0.02] p-4 sm:grid-cols-3">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
                  Avg. budget / project
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {dept.projects > 0 ? formatMoney(Math.round(parseMoney(dept.budget) / dept.projects)) : "—"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
                  Storage / member
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {dept.members > 0 ? `${Math.round(parseStorage(dept.storage) / dept.members)} GB` : "—"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
                  Projects / member
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {dept.members > 0 ? (dept.projects / dept.members).toFixed(1) : "—"}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-white/8 pt-4">
        {isEditing ? (
          <>
            <Button tone="blue" onClick={() => onSaveEdit(draftName, draftLead)}>
              Save changes
            </Button>
            <Button tone="white" variant="ghost" onClick={onCancelEdit}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <ActionButton icon="file" label="Edit department" onClick={onStartEdit} />
            <ActionButton icon="user" label="Add team member" onClick={onAddMember} />
            <ActionButton icon="plus" label="Assign project" onClick={onAssignProject} />
            <ActionButton
              icon={expanded ? "chevron" : "chart"}
              label={expanded ? "Hide details" : "View department"}
              onClick={onToggleExpand}
            />
            <ActionButton icon="x" label="Delete" tone="danger" onClick={onDelete} />
          </>
        )}
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function DepartmentsPage() {
  const { toast } = useClient();
  const [departments, setDepartments] = useLocalState<Department[]>(CLIENT_KEYS.departments, MOCK_DEPARTMENTS);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totals = useMemo(() => {
    return {
      count: departments.length,
      members: departments.reduce((sum, d) => sum + d.members, 0),
      projects: departments.reduce((sum, d) => sum + d.projects, 0),
      budget: departments.reduce((sum, d) => sum + parseMoney(d.budget), 0),
    };
  }, [departments]);

  /* ---- handlers (random/time only inside handlers) ---- */

  const handleCreate = (form: CreateForm) => {
    const newDept: Department = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      lead: form.lead.trim() || "Unassigned",
      members: 0,
      projects: 0,
      budget: "$0",
      storage: "0 GB",
    };
    setDepartments((prev) => [newDept, ...prev]);
    setShowForm(false);
    toast("Department created");
  };

  const handleSaveEdit = (id: string, name: string, lead: string) => {
    setDepartments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, name: name.trim() || d.name, lead: lead.trim() || d.lead } : d,
      ),
    );
    setEditingId(null);
    toast("Department updated");
  };

  const handleAddMember = (id: string) => {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, members: d.members + 1 } : d)));
    toast("Team member added");
  };

  const handleAssignProject = (id: string) => {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, projects: d.projects + 1 } : d)));
    toast("Project assigned");
  };

  const handleDelete = (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    if (editingId === id) setEditingId(null);
    if (expandedId === id) setExpandedId(null);
    toast("Department deleted");
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <SectionTitle
        title="Departments"
        subtitle="Organise your company into teams — track members, projects, budget and storage across every department."
        action={
          <div className="flex items-center gap-3">
            <FeatureTag feature="departments" />
            <DemoModeNotice />
            <Button
              tone="blue"
              onClick={() => {
                setShowForm((s) => !s);
                if (editingId) setEditingId(null);
              }}
            >
              <Icon name="plus" size={15} />
              {showForm ? "Hide form" : "Create department"}
            </Button>
          </div>
        }
      />

      <FeatureGate feature="departments">
        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Departments" value={String(totals.count)} sub="across the company" icon="building" />
          <MetricCard
            label="Total members"
            value={String(totals.members)}
            sub="people allocated"
            icon="users"
            accent="text-escrow-green"
          />
          <MetricCard
            label="Active projects"
            value={String(totals.projects)}
            sub="in flight"
            icon="kanban"
            accent="text-review-gold"
          />
          <MetricCard
            label="Allocated budget"
            value={formatMoney(totals.budget)}
            sub="combined"
            icon="wallet"
            accent="text-aerial-cyan"
          />
        </div>

        {/* Create form */}
        {showForm && (
          <div className="mt-6">
            <CreateDepartmentForm onCancel={() => setShowForm(false)} onSubmit={handleCreate} />
          </div>
        )}

        {/* Department grid */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {departments.length === 0 ? (
            <Panel className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-white/50">
                <Icon name="building" size={24} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-white">No departments yet</h3>
              <p className="mt-2 max-w-sm text-sm text-white/55">
                Create your first department to start organising teams, budgets and projects.
              </p>
              <div className="mt-5">
                <Button tone="blue" onClick={() => setShowForm(true)}>
                  <Icon name="plus" size={15} />
                  Create department
                </Button>
              </div>
            </Panel>
          ) : (
            departments.map((dept) => (
              <DepartmentCard
                key={dept.id}
                dept={dept}
                expanded={expandedId === dept.id}
                onToggleExpand={() => setExpandedId((id) => (id === dept.id ? null : dept.id))}
                isEditing={editingId === dept.id}
                onStartEdit={() => {
                  setEditingId(dept.id);
                  setShowForm(false);
                }}
                onCancelEdit={() => setEditingId(null)}
                onSaveEdit={(name, lead) => handleSaveEdit(dept.id, name, lead)}
                onAddMember={() => handleAddMember(dept.id)}
                onAssignProject={() => handleAssignProject(dept.id)}
                onDelete={() => handleDelete(dept.id)}
              />
            ))
          )}
        </div>
      </FeatureGate>
    </div>
  );
}
