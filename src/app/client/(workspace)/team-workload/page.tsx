"use client";

import { useMemo, useState } from "react";
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
import { Icon } from "@/components/dashboard/icons";
import { MOCK_TEAM, MOCK_DEPARTMENTS, type TeamMember } from "@/lib/client/mock";

/* -------------------------------------------------------------------------- */
/*  Local persistence key                                                      */
/* -------------------------------------------------------------------------- */

const WORKLOAD_KEY = "grid:client:workload";

type RangeKey = "week" | "month";
type StatusTone = "green" | "gold" | "red" | "gray";

/* -------------------------------------------------------------------------- */
/*  Capacity helpers (pure — no time / random in render)                       */
/* -------------------------------------------------------------------------- */

/** Bar colour band by capacity: <70 green, 70–90 gold, >90 red. */
function capacityTone(capacity: number): string {
  if (capacity > 90) return "bg-urgent-red";
  if (capacity >= 70) return "bg-review-gold";
  return "bg-escrow-green";
}

/** Availability badge tone derived from the member's status. */
const STATUS_TONE: Record<TeamMember["status"], StatusTone> = {
  Available: "green",
  Busy: "gold",
  Overloaded: "red",
};

/** Derive an availability status from a capacity number (used after edits). */
function statusForCapacity(capacity: number): TeamMember["status"] {
  if (capacity > 90) return "Overloaded";
  if (capacity >= 70) return "Busy";
  return "Available";
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/* -------------------------------------------------------------------------- */
/*  Member card                                                                */
/* -------------------------------------------------------------------------- */

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.02] px-3.5 py-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-aerial-cyan">
        <Icon name={icon} size={15} />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold tracking-tight text-white">{value}</div>
        <div className="text-[11px] uppercase tracking-[0.12em] text-white/40">{label}</div>
      </div>
    </div>
  );
}

function MemberCard({
  member,
  rangeLabel,
  onView,
  onAssign,
}: {
  member: TeamMember;
  rangeLabel: string;
  onView: () => void;
  onAssign: () => void;
}) {
  const overloaded = member.capacity > 90;
  const initials = member.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Panel className={`flex flex-col gap-4 transition-colors hover:border-white/20 ${overloaded ? "border-urgent-red/30" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-grid-blue/15 text-sm font-semibold text-aerial-cyan ring-1 ring-grid-blue/25">
            {initials}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight text-white">{member.name}</h3>
            <p className="truncate text-xs text-white/55">{member.role}</p>
          </div>
        </div>
        <StatusBadge label={member.status} tone={STATUS_TONE[member.status]} />
      </div>

      {/* Department */}
      <div className="flex items-center gap-1.5 text-xs text-white/50">
        <Icon name="building" size={13} className="text-white/40" />
        {member.department}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <Stat icon="list" label={`Tasks · ${rangeLabel}`} value={member.tasks} />
        <Stat icon="kanban" label="Projects" value={member.projects} />
      </div>

      {/* Capacity */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="uppercase tracking-[0.12em] text-white/45">Capacity · {rangeLabel}</span>
          <span className="font-semibold text-white">{member.capacity}%</span>
        </div>
        <ProgressBar value={member.capacity} tone={capacityTone(member.capacity)} />
      </div>

      {/* Overloaded warning */}
      {overloaded && (
        <div className="flex items-center gap-2 rounded-2xl border border-urgent-red/25 bg-urgent-red/10 px-3.5 py-2.5 text-xs font-medium text-urgent-red">
          <Icon name="bell" size={14} />
          Overloaded — rebalance to protect delivery.
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-white/8 pt-4">
        <Button tone="white" variant="ghost" onClick={onView}>
          <Icon name="user" size={14} />
          View member
        </Button>
        <Button tone="blue" onClick={onAssign}>
          <Icon name="plus" size={14} />
          Assign task
        </Button>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TeamWorkloadPage() {
  const { toast } = useClient();
  const [team, setTeam] = useLocalState<TeamMember[]>(WORKLOAD_KEY, MOCK_TEAM);
  const [dept, setDept] = useState<string>("All");
  const [range, setRange] = useState<RangeKey>("week");

  const rangeLabel = range === "week" ? "Week" : "Month";

  const departments = useMemo(() => ["All", ...MOCK_DEPARTMENTS.map((d) => d.name)], []);

  const visible = useMemo(
    () => (dept === "All" ? team : team.filter((m) => m.department === dept)),
    [team, dept],
  );

  /* ---- aggregate metrics ---- */
  const metrics = useMemo(() => {
    const count = team.length;
    const avg = count ? Math.round(team.reduce((s, m) => s + m.capacity, 0) / count) : 0;
    const overloaded = team.filter((m) => m.capacity > 90).length;
    const available = team.filter((m) => m.capacity < 70).length;
    return { count, avg, overloaded, available };
  }, [team]);

  /* ---- handlers (all mutation + toasts here) ---- */

  const handleRebalance = () => {
    // Smooth every capacity toward a healthy ~70% target. Pure arithmetic on
    // existing values — no random / time, so it stays deterministic.
    const TARGET = 70;
    setTeam((prev) =>
      prev.map((m) => {
        const smoothed = clamp(m.capacity + (TARGET - m.capacity) * 0.6);
        return { ...m, capacity: smoothed, status: statusForCapacity(smoothed) };
      }),
    );
    toast("Workload rebalanced");
  };

  const handleView = (member: TeamMember) => {
    toast(`Opened ${member.name}'s workload`);
  };

  const handleAssign = (id: string) => {
    setTeam((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const capacity = clamp(m.capacity + 8);
        return { ...m, tasks: m.tasks + 1, capacity, status: statusForCapacity(capacity) };
      }),
    );
    toast("Task assigned");
  };

  return (
    <FeatureGate feature="team-workload">
      <div className="mx-auto w-full max-w-6xl">
        <SectionTitle
          title="Team workload"
          subtitle="Balance capacity across departments, spot overloaded teammates early and redistribute work in one click."
          action={
            <div className="flex flex-wrap items-center gap-3">
              <DemoModeNotice />
              <FeatureTag feature="team-workload" />
              <Button tone="green" onClick={handleRebalance}>
                <Icon name="target" size={15} />
                Rebalance workload
              </Button>
            </div>
          }
        />

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Team members" value={String(metrics.count)} sub="across departments" icon="users" />
          <MetricCard
            label="Avg capacity"
            value={`${metrics.avg}%`}
            sub={`${rangeLabel.toLowerCase()} view`}
            icon="chart"
            accent={metrics.avg > 90 ? "text-urgent-red" : metrics.avg >= 70 ? "text-review-gold" : "text-escrow-green"}
          />
          <MetricCard label="Overloaded" value={String(metrics.overloaded)} sub="over 90% capacity" icon="bell" accent="text-urgent-red" />
          <MetricCard label="Available" value={String(metrics.available)} sub="room for more" icon="check" accent="text-escrow-green" />
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {/* Department filter */}
          <div className="overflow-x-auto">
            <div className="flex min-w-max items-center gap-2">
              {departments.map((d) => {
                const active = dept === d;
                const n = d === "All" ? team.length : team.filter((m) => m.department === d).length;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDept(d)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "border-grid-blue/40 bg-grid-blue/15 text-aerial-cyan"
                        : "border-white/10 text-white/60 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {d}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                        active ? "bg-grid-blue/25 text-aerial-cyan" : "bg-white/10 text-white/55"
                      }`}
                    >
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Week / Month toggle */}
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1">
            {(["week", "month"] as RangeKey[]).map((r) => {
              const active = range === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                    active ? "bg-white text-grid-black" : "text-white/60 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Member grid */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.length === 0 ? (
            <Panel className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-white/50">
                <Icon name="users" size={24} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-white">No teammates in {dept}</h3>
              <p className="mt-2 max-w-sm text-sm text-white/55">
                Pick another department to view its capacity.
              </p>
              <div className="mt-5">
                <Button tone="white" variant="ghost" onClick={() => setDept("All")}>
                  Show all departments
                </Button>
              </div>
            </Panel>
          ) : (
            visible.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                rangeLabel={rangeLabel}
                onView={() => handleView(member)}
                onAssign={() => handleAssign(member.id)}
              />
            ))
          )}
        </div>
      </div>
    </FeatureGate>
  );
}
