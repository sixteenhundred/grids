"use client";

import { useState, useTransition } from "react";
import {
  setFlag,
  setAllFlags,
  resetFlags,
  auditServer,
  cleanServer,
  restartServer,
  setPlatformLiveFlag,
  type WaitlistEntry,
} from "@/lib/admin-actions";
import {
  FEATURES,
  FEATURE_CATEGORIES,
  type FeatureCategory,
} from "@/lib/features";
import type { AuditReport, FlagMap, ServerActionResult } from "@/lib/admin-types";
import { Card, PageHeader, StatusPill, Toggle } from "./ui";
import { Icon, type IconName } from "./icons";

function fmtUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function AdminPanel({
  initialFlags,
  initialAudit,
  initialLive,
  initialWaitlist,
}: {
  initialFlags: FlagMap;
  initialAudit: AuditReport;
  initialLive: boolean;
  initialWaitlist: WaitlistEntry[];
}) {
  const [flags, setFlags] = useState<FlagMap>(initialFlags);
  const [audit, setAudit] = useState<AuditReport>(initialAudit);
  const [live, setLive] = useState(initialLive);
  const [log, setLog] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function note(r: ServerActionResult | { ok: boolean; message: string }) {
    setLog({ ok: r.ok, text: r.message });
  }

  // --- Feature toggles ----------------------------------------------------
  function toggle(key: string, next: boolean) {
    setFlags((f) => ({ ...f, [key]: next })); // optimistic
    start(async () => {
      try {
        note(await setFlag(key, next));
      } catch {
        setFlags((f) => ({ ...f, [key]: !next })); // revert
        setLog({ ok: false, text: "Failed to save — admin access required." });
      }
    });
  }

  function bulk(enabled: boolean) {
    setFlags((f) => {
      const n = { ...f };
      for (const feat of FEATURES) n[feat.key] = enabled;
      return n;
    });
    start(async () => note(await setAllFlags(enabled)));
  }

  function reset() {
    start(async () => {
      const r = await resetFlags();
      setFlags(Object.fromEntries(FEATURES.map((f) => [f.key, f.defaultOn])));
      note(r);
    });
  }

  // --- Server controls ----------------------------------------------------
  async function runAudit() {
    setBusy("audit");
    try {
      const next = await auditServer();
      setAudit(next);
      setLog({ ok: true, text: "Audit refreshed." });
    } catch {
      setLog({ ok: false, text: "Audit failed — admin access required." });
    } finally {
      setBusy(null);
    }
  }

  async function control(
    label: string,
    fn: () => Promise<ServerActionResult>,
  ) {
    setBusy(label);
    try {
      note(await fn());
      setAudit(await auditServer()); // refresh status afterward
    } catch {
      setLog({ ok: false, text: `${label} failed.` });
    } finally {
      setBusy(null);
    }
  }

  const enabledCount = Object.values(flags).filter(Boolean).length;
  const total = FEATURES.length;

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Control Panel"
        subtitle="Switch features on and off across the live site, run maintenance, and watch the server's health in real time."
        tone="purple"
        action={
          <button
            onClick={runAudit}
            disabled={busy === "audit"}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.08] disabled:opacity-50"
          >
            <Icon name="trending" size={16} className={busy === "audit" ? "animate-pulse" : ""} />
            {busy === "audit" ? "Refreshing…" : "Refresh status"}
          </button>
        }
      />

      {/* result toast line */}
      {log && (
        <div
          className={`mb-6 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
            log.ok
              ? "border-escrow-green/30 bg-escrow-green/10 text-escrow-green"
              : "border-urgent-red/30 bg-urgent-red/10 text-urgent-red"
          }`}
        >
          <Icon name={log.ok ? "check" : "x"} size={16} />
          {log.text}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Launch + waitlist                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">Launch</h2>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Icon name="globe" size={16} className={live ? "text-escrow-green" : "text-review-gold"} />
                Platform {live ? "live" : "hidden (waitlist only)"}
              </div>
              <div className="mt-0.5 text-xs text-white/45">
                {live
                  ? "Public can reach the full platform."
                  : "Public sees only the waitlist. Admins keep full access."}
              </div>
            </div>
            <Toggle
              checked={live}
              tone="purple"
              label="Platform live"
              onChange={(next) => {
                setLive(next); // optimistic
                start(async () => {
                  try {
                    note(await setPlatformLiveFlag(next));
                  } catch {
                    setLive(!next);
                    setLog({ ok: false, text: "Failed — admin access required." });
                  }
                });
              }}
            />
          </div>
        </Card>
        <Card className="mt-3 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Icon name="mail" size={16} className="text-aerial-cyan" /> Waitlist{" "}
              <span className="font-normal text-white/45">({initialWaitlist.length})</span>
            </div>
            <SmallBtn onClick={() => downloadCsv(initialWaitlist)} disabled={!initialWaitlist.length}>
              Export CSV
            </SmallBtn>
          </div>
          {initialWaitlist.length ? (
            <ul className="mt-4 max-h-64 divide-y divide-white/6 overflow-y-auto">
              {initialWaitlist.map((w) => (
                <li key={w.email} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-white/80">{w.email}</span>
                  <span className="font-mono text-xs text-white/35">{w.joinedAt.slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-white/45">No signups yet.</p>
          )}
        </Card>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Live server status                                                */}
      {/* ---------------------------------------------------------------- */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-white">Server status</h2>
          <StatusPill tone={audit.db.connected ? "escrow" : "red"} live={audit.db.connected}>
            {audit.db.connected ? "Online" : "Degraded"}
          </StatusPill>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Environment" value={audit.env} icon="globe" />
          <Stat label="Uptime" value={fmtUptime(audit.uptimeMs)} icon="clock" sub={`build ${audit.bootId}`} />
          <Stat label="Features live" value={`${enabledCount}/${total}`} icon="grid" tone={enabledCount === total ? "escrow" : "gold"} />
          <Stat label="Node" value={audit.node} icon="command" />
        </div>

        {/* Database */}
        <Card className="mt-3 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Icon name="folder" size={16} className="text-aerial-cyan" /> Database
            </div>
            <StatusPill tone={audit.db.connected ? "escrow" : "red"}>
              {audit.db.connected ? "Connected" : audit.db.configured ? "Unreachable" : "Not configured"}
            </StatusPill>
          </div>
          <div className="mt-1 text-xs text-white/45">{audit.db.driver}</div>
          {audit.db.connected ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(audit.db.tables).map(([name, count]) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1 text-xs text-white/65"
                >
                  <span className="text-white/45">{name}</span>
                  <span className="font-mono font-medium text-white">{count ?? "—"}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-white/45">
              {audit.db.error ?? "Connect Turso to enable Shop, Academy and shared flag storage."}
            </p>
          )}
        </Card>

        {/* Env vars */}
        <Card className="mt-3 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Icon name="lock" size={16} className="text-review-gold" /> Configuration
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {audit.envVars.map((v) => (
              <div key={v.name} className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                <span className="font-mono text-xs text-white/65">{v.name}</span>
                <span className={`inline-flex items-center gap-1 text-xs ${v.present ? "text-escrow-green" : "text-white/35"}`}>
                  <Icon name={v.present ? "check" : "x"} size={13} />
                  {v.present ? "set" : "unset"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Maintenance                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">Maintenance</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ControlButton
            icon="trending"
            tone="blue"
            title="Audit"
            desc="Re-scan health, DB and config"
            busy={busy === "audit"}
            onClick={runAudit}
          />
          <ControlButton
            icon="check"
            tone="escrow"
            title="Clean"
            desc="Clear caches & expired sessions"
            busy={busy === "Clean"}
            onClick={() => control("Clean", cleanServer)}
          />
          <ControlButton
            icon="command"
            tone="gold"
            title="Restart"
            desc="Soft restart this instance"
            busy={busy === "Restart"}
            onClick={() => control("Restart", restartServer)}
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Feature switches                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-white">Features</h2>
          <div className="flex items-center gap-2">
            <SmallBtn onClick={() => bulk(true)} disabled={pending}>Enable all</SmallBtn>
            <SmallBtn onClick={() => bulk(false)} disabled={pending}>Disable all</SmallBtn>
            <SmallBtn onClick={reset} disabled={pending}>Reset</SmallBtn>
          </div>
        </div>

        <div className="space-y-6">
          {FEATURE_CATEGORIES.map((cat) => (
            <CategoryBlock key={cat} cat={cat} flags={flags} onToggle={toggle} />
          ))}
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Stat({
  label,
  value,
  icon,
  sub,
  tone = "blue",
}: {
  label: string;
  value: string;
  icon: IconName;
  sub?: string;
  tone?: "blue" | "escrow" | "gold";
}) {
  const c = { blue: "text-aerial-cyan", escrow: "text-escrow-green", gold: "text-review-gold" }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/45">
        <Icon name={icon} size={14} className={c} /> {label}
      </div>
      <div className="mt-2 truncate text-xl font-semibold tracking-tight text-white">{value}</div>
      {sub && <div className="mt-0.5 font-mono text-[11px] text-white/35">{sub}</div>}
    </Card>
  );
}

function ControlButton({
  icon,
  title,
  desc,
  tone,
  busy,
  onClick,
}: {
  icon: IconName;
  title: string;
  desc: string;
  tone: "blue" | "escrow" | "gold";
  busy: boolean;
  onClick: () => void;
}) {
  const ring = { blue: "ring-grid-blue/25 text-aerial-cyan bg-grid-blue/12", escrow: "ring-escrow-green/25 text-escrow-green bg-escrow-green/12", gold: "ring-review-gold/25 text-review-gold bg-review-gold/12" }[tone];
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.055] disabled:opacity-50"
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${ring}`}>
        <Icon name={icon} size={20} className={busy ? "animate-pulse" : ""} />
      </span>
      <div>
        <div className="text-sm font-semibold text-white">{busy ? "Working…" : title}</div>
        <div className="mt-0.5 text-xs leading-snug text-white/45">{desc}</div>
      </div>
    </button>
  );
}

function downloadCsv(rows: WaitlistEntry[]) {
  const csv = "email,joined_at\n" + rows.map((r) => `${r.email},${r.joinedAt}`).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "grid-waitlist.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function SmallBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function CategoryBlock({
  cat,
  flags,
  onToggle,
}: {
  cat: FeatureCategory;
  flags: FlagMap;
  onToggle: (key: string, next: boolean) => void;
}) {
  const items = FEATURES.filter((f) => f.category === cat);
  const on = items.filter((f) => flags[f.key]).length;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">{cat}</span>
        <span className="text-xs text-white/40">{on}/{items.length} on</span>
      </div>
      <ul className="divide-y divide-white/6">
        {items.map((f) => (
          <li key={f.key} className="flex items-center justify-between gap-4 px-5 py-3.5">
            <div className="min-w-0">
              <div className="text-sm font-medium text-white">{f.label}</div>
              <div className="truncate text-xs text-white/45">{f.desc}</div>
            </div>
            <Toggle
              checked={!!flags[f.key]}
              onChange={(next) => onToggle(f.key, next)}
              tone="purple"
              label={f.label}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
