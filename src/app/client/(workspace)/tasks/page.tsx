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
import { Icon } from "@/components/dashboard/icons";
import { CLIENT_KEYS } from "@/lib/client/config";
import {
  MOCK_TASKS,
  MOCK_TEAM,
  MOCK_DEPARTMENTS,
  MOCK_PROJECTS,
  type Task,
  type TaskStatus,
} from "@/lib/client/mock";

/* -------------------------------------------------------------------------- */
/*  Constants + helpers                                                        */
/* -------------------------------------------------------------------------- */

type ViewMode = "board" | "list" | "calendar";
type Priority = Task["priority"];

const PRIORITIES: Priority[] = ["Low", "Medium", "High"];

const PRIORITY_TONE: Record<Priority, "gray" | "gold" | "red"> = {
  Low: "gray",
  Medium: "gold",
  High: "red",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
};

const STATUS_TONE: Record<TaskStatus, "gray" | "blue" | "green"> = {
  todo: "gray",
  "in-progress": "blue",
  done: "green",
};

const COLUMNS: { status: TaskStatus; accent: string; dot: string }[] = [
  { status: "todo", accent: "text-white/55", dot: "bg-white/40" },
  { status: "in-progress", accent: "text-aerial-cyan", dot: "bg-grid-blue" },
  { status: "done", accent: "text-escrow-green", dot: "bg-escrow-green" },
];

const TEAM_NAMES: string[] = MOCK_TEAM.map((m) => m.name);
const DEPARTMENT_NAMES: string[] = MOCK_DEPARTMENTS.map((d) => d.name);
const PROJECT_NAMES: string[] = MOCK_PROJECTS.map((p) => p.name);

function formatDue(iso: string): string {
  // Static parse of YYYY-MM-DD — no Date.now / locale-time, hydration safe.
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!m || !d) return iso;
  return `${months[m - 1]} ${d}`;
}

function nextPriority(p: Priority): Priority {
  const idx = PRIORITIES.indexOf(p);
  return PRIORITIES[(idx + 1) % PRIORITIES.length];
}

function nextAssignee(current: string): string {
  if (TEAM_NAMES.length === 0) return current;
  const idx = TEAM_NAMES.indexOf(current);
  return TEAM_NAMES[(idx + 1) % TEAM_NAMES.length];
}

function departmentForAssignee(name: string, fallback: string): string {
  return MOCK_TEAM.find((m) => m.name === name)?.department ?? fallback;
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
/*  Create task form                                                           */
/* -------------------------------------------------------------------------- */

type FormState = {
  title: string;
  assignee: string;
  department: string;
  project: string;
  priority: Priority;
  due: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  assignee: TEAM_NAMES[0] ?? "",
  department: DEPARTMENT_NAMES[0] ?? "",
  project: PROJECT_NAMES[0] ?? "",
  priority: "Medium",
  due: "",
};

function CreateTaskForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (form: FormState) => void }) {
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
          <h3 className="text-lg font-semibold tracking-tight text-white">Create a task</h3>
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
            <Field label="Task title">
              <input
                className={fieldClasses()}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Brief twilight shoot creative"
              />
            </Field>
          </div>

          <Field label="Assignee">
            <select
              className={fieldClasses()}
              value={form.assignee}
              onChange={(e) => set("assignee", e.target.value)}
            >
              {TEAM_NAMES.map((n) => (
                <option key={n} value={n} className="bg-[#0c1117]">
                  {n}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Department">
            <select
              className={fieldClasses()}
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
            >
              {DEPARTMENT_NAMES.map((d) => (
                <option key={d} value={d} className="bg-[#0c1117]">
                  {d}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Related project">
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

          <Field label="Priority">
            <select
              className={fieldClasses()}
              value={form.priority}
              onChange={(e) => set("priority", e.target.value as Priority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p} className="bg-[#0c1117]">
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Due date">
            <input type="date" className={fieldClasses()} value={form.due} onChange={(e) => set("due", e.target.value)} />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button tone="white" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button tone="blue" type="submit" disabled={!valid}>
            Add task
          </Button>
        </div>
      </form>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Task card + action buttons                                                 */
/* -------------------------------------------------------------------------- */

function TaskAction({
  icon,
  label,
  onClick,
  tone = "neutral",
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
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

function TaskMeta({ icon, children }: { icon: React.ComponentProps<typeof Icon>["name"]; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-white/55">
      <Icon name={icon} size={12} className="text-white/40" />
      {children}
    </span>
  );
}

function TaskCard({
  task,
  onComplete,
  onCyclePriority,
  onReassign,
  onDelete,
}: {
  task: Task;
  onComplete: () => void;
  onCyclePriority: () => void;
  onReassign: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] transition-colors hover:border-white/20">
      <div className="flex items-start justify-between gap-3">
        <h4 className={`text-sm font-semibold leading-snug tracking-tight text-white ${task.status === "done" ? "line-through opacity-60" : ""}`}>
          {task.title}
        </h4>
        <StatusBadge label={task.priority} tone={PRIORITY_TONE[task.priority]} />
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <TaskMeta icon="user">
          <span className="font-medium text-white/75">{task.assignee}</span>
        </TaskMeta>
        <TaskMeta icon="building">{task.department}</TaskMeta>
        <TaskMeta icon="kanban">{task.project}</TaskMeta>
        <TaskMeta icon="calendar">Due {formatDue(task.due)}</TaskMeta>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-white/8 pt-3">
        {task.status !== "done" && <TaskAction icon="check" label="Complete" tone="good" onClick={onComplete} />}
        <TaskAction icon="target" label="Priority" onClick={onCyclePriority} />
        <TaskAction icon="users" label="Reassign" onClick={onReassign} />
        <TaskAction icon="x" label="Delete" tone="danger" onClick={onDelete} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TasksPage() {
  const { toast } = useClient();
  const [tasks, setTasks] = useLocalState<Task[]>(CLIENT_KEYS.tasks, MOCK_TASKS);
  const [view, setView] = useState<ViewMode>("board");
  const [showForm, setShowForm] = useState(false);

  const counts = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      done: tasks.filter((t) => t.status === "done").length,
    }),
    [tasks],
  );

  const byStatus = useMemo<Record<TaskStatus, Task[]>>(
    () => ({
      todo: tasks.filter((t) => t.status === "todo"),
      "in-progress": tasks.filter((t) => t.status === "in-progress"),
      done: tasks.filter((t) => t.status === "done"),
    }),
    [tasks],
  );

  /* ---- handlers (random ids only inside handlers) ---- */

  const handleCreate = (form: FormState) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      assignee: form.assignee || TEAM_NAMES[0] || "Unassigned",
      department: form.department || DEPARTMENT_NAMES[0] || "—",
      project: form.project || PROJECT_NAMES[0] || "—",
      priority: form.priority,
      status: "todo",
      due: form.due || "—",
    };
    setTasks((prev) => [newTask, ...prev]);
    setShowForm(false);
    toast("Task created");
  };

  const handleComplete = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: "done" } : t)));
    toast("Marked complete");
  };

  const handleCyclePriority = (id: string) => {
    let label: Priority = "Low";
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        label = nextPriority(t.priority);
        return { ...t, priority: label };
      }),
    );
    toast(`Priority set to ${label}`);
  };

  const handleReassign = (id: string) => {
    let name = "";
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        name = nextAssignee(t.assignee);
        return { ...t, assignee: name, department: departmentForAssignee(name, t.department) };
      }),
    );
    toast(`Reassigned to ${name}`);
  };

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast("Task deleted");
  };

  const VIEWS: { key: ViewMode; label: string; icon: React.ComponentProps<typeof Icon>["name"] }[] = [
    { key: "board", label: "Board", icon: "kanban" },
    { key: "list", label: "List", icon: "list" },
    { key: "calendar", label: "Calendar", icon: "calendar" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <SectionTitle
        title="Tasks"
        subtitle="Assign internal work across departments, track it through a shared board and keep every project moving."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <DemoModeNotice />
            <FeatureTag feature="tasks" />
            <Button tone="blue" onClick={() => setShowForm((s) => !s)}>
              <Icon name="plus" size={15} />
              {showForm ? "Hide form" : "Create task"}
            </Button>
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="All tasks" value={String(counts.total)} sub="assigned internally" icon="list" />
        <MetricCard label="To do" value={String(counts.todo)} sub="not started" icon="clock" accent="text-review-gold" />
        <MetricCard label="In progress" value={String(counts.inProgress)} sub="being worked on" icon="kanban" accent="text-aerial-cyan" />
        <MetricCard label="Done" value={String(counts.done)} sub="completed" icon="check" accent="text-escrow-green" />
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mt-6">
          <CreateTaskForm onCancel={() => setShowForm(false)} onSubmit={handleCreate} />
        </div>
      )}

      {/* View toggle */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto">
        <div className="flex min-w-max items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {VIEWS.map((v) => {
            const active = view === v.key;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => setView(v.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-grid-blue/20 text-aerial-cyan" : "text-white/55 hover:text-white"
                }`}
              >
                <Icon name={v.icon} size={14} />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Board view */}
      {view === "board" && (
        <div className="mt-5 overflow-x-auto pb-2">
          <div className="grid min-w-[44rem] grid-cols-3 gap-4">
            {COLUMNS.map(({ status, accent, dot }) => {
              const items = byStatus[status];
              return (
                <div key={status} className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <span className={`inline-flex items-center gap-2 text-sm font-semibold tracking-tight ${accent}`}>
                      <span className={`h-2 w-2 rounded-full ${dot}`} />
                      {STATUS_LABEL[status]}
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/55">{items.length}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {items.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/35">
                        Nothing here
                      </div>
                    ) : (
                      items.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onComplete={() => handleComplete(task.id)}
                          onCyclePriority={() => handleCyclePriority(task.id)}
                          onReassign={() => handleReassign(task.id)}
                          onDelete={() => handleDelete(task.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="mt-5">
          {tasks.length === 0 ? (
            <Panel className="flex flex-col items-center justify-center py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-white/50">
                <Icon name="list" size={24} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-white">No tasks yet</h3>
              <p className="mt-2 max-w-sm text-sm text-white/55">Create your first task to start assigning internal work.</p>
              <div className="mt-5">
                <Button tone="blue" onClick={() => setShowForm(true)}>
                  <Icon name="plus" size={15} />
                  Create task
                </Button>
              </div>
            </Panel>
          ) : (
            <Panel className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/8 text-[11px] uppercase tracking-[0.12em] text-white/45">
                      <th className="px-5 py-3.5 font-medium">Task</th>
                      <th className="px-4 py-3.5 font-medium">Assignee</th>
                      <th className="px-4 py-3.5 font-medium">Project</th>
                      <th className="px-4 py-3.5 font-medium">Priority</th>
                      <th className="px-4 py-3.5 font-medium">Status</th>
                      <th className="px-4 py-3.5 font-medium">Due</th>
                      <th className="px-4 py-3.5 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]">
                        <td className="px-5 py-3.5">
                          <span className={`font-medium text-white ${task.status === "done" ? "line-through opacity-60" : ""}`}>
                            {task.title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-white/40">{task.department}</span>
                        </td>
                        <td className="px-4 py-3.5 text-white/70">{task.assignee}</td>
                        <td className="px-4 py-3.5 text-white/70">{task.project}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge label={task.priority} tone={PRIORITY_TONE[task.priority]} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge label={STATUS_LABEL[task.status]} tone={STATUS_TONE[task.status]} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-white/60">{formatDue(task.due)}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {task.status !== "done" && (
                              <TaskAction icon="check" label="Complete" tone="good" onClick={() => handleComplete(task.id)} />
                            )}
                            <TaskAction icon="target" label="Priority" onClick={() => handleCyclePriority(task.id)} />
                            <TaskAction icon="users" label="Reassign" onClick={() => handleReassign(task.id)} />
                            <TaskAction icon="x" label="Delete" tone="danger" onClick={() => handleDelete(task.id)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>
      )}

      {/* Calendar placeholder */}
      {view === "calendar" && (
        <div className="mt-5">
          <Panel className="flex flex-col items-center justify-center py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-grid-blue/15 text-aerial-cyan ring-1 ring-grid-blue/25">
              <Icon name="calendar" size={24} />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-white">Calendar view</h3>
            <p className="mt-2 max-w-md text-sm text-white/55">
              A scheduling calendar with due dates plotted across the month is coming soon. For now, switch to Board or List to manage
              your tasks.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button tone="white" variant="ghost" onClick={() => setView("board")}>
                <Icon name="kanban" size={15} />
                Open board
              </Button>
              <Button tone="blue" onClick={() => setView("list")}>
                <Icon name="list" size={15} />
                Open list
              </Button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
