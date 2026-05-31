"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Surface, Card, Button, Icon, StatusPill } from "@/components/dashboard/ui";
import { useSession } from "@/lib/auth-client";
import { CONTRACTS, money } from "@/lib/grid-data";
import {
  loadVersions,
  saveVersions,
  currentTerms,
  diffNote,
  formatVersionTime,
  type ContractVersion,
  type ContractTerms,
} from "@/lib/contracts-store";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/8 py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <span className="w-32 shrink-0 text-xs uppercase tracking-[0.14em] text-white/45">{label}</span>
      <div className="text-sm leading-relaxed text-white/85">{children}</div>
    </div>
  );
}

function EditField({ label, value, onChange, textarea, type = "text" }: { label: string; value: string | number; onChange: (v: string) => void; textarea?: boolean; type?: string }) {
  const cls = "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-grid-blue/50";
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-white/45">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={`${cls} resize-none leading-relaxed`} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useSession();
  const editor = data?.user?.name ?? "You";
  const contract = CONTRACTS.find((c) => c.id === id);

  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ContractTerms | null>(null);
  const [openVersion, setOpenVersion] = useState<number | null>(null);

  useEffect(() => {
    if (contract) setVersions(loadVersions(contract));
  }, [contract]);

  if (!contract) {
    return (
      <div className="rise flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-sm p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white">Contract not found</h1>
          <div className="mt-6">
            <Button href="/dashboard/contracts" arrow>
              Back to Contracts
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <Surface radius="2rem" inner="p-10">
        <p className="text-center text-sm text-white/45">Loading contract…</p>
      </Surface>
    );
  }

  const terms = currentTerms(versions);
  const setD = <K extends keyof ContractTerms>(k: K, v: ContractTerms[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  function startEdit() {
    setDraft({ ...terms });
    setEditing(true);
  }
  function save() {
    if (!draft || !contract) return;
    const note = diffNote(terms, draft);
    if (note === "No changes") {
      setEditing(false);
      return;
    }
    const next: ContractVersion = { version: versions.length + 1, editor, at: Date.now(), note, terms: draft };
    const updated = [...versions, next];
    setVersions(updated);
    saveVersions(contract.id, updated);
    setEditing(false);
  }

  const history = [...versions].reverse();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {/* Breadcrumb */}
      <div className="rise flex items-center justify-between">
        <Link href="/dashboard/contracts" className="inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white">
          <Icon name="chevron" size={14} className="rotate-180" /> Contracts
        </Link>
        <span className="font-mono text-xs text-white/40">#{contract.id}</span>
      </div>

      {/* Contract */}
      <div className="rise" style={{ animationDelay: "60ms" }}>
        <Surface radius="2rem" inner="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">{terms.pkg}</h1>
              <p className="mt-1 text-sm text-white/55">with {contract.withName} · {contract.date}</p>
            </div>
            <StatusPill tone={contract.status === "Completed" ? "escrow" : "blue"} live={contract.status === "Active"}>
              {contract.status}
            </StatusPill>
          </div>

          <div className="my-6 h-px bg-white/10" />

          {editing && draft ? (
            <div className="flex flex-col gap-4">
              <EditField label="Package" value={draft.pkg} onChange={(v) => setD("pkg", v)} />
              <EditField label="Scope" value={draft.scope} onChange={(v) => setD("scope", v)} textarea />
              <EditField label="Deliverables" value={draft.deliverables} onChange={(v) => setD("deliverables", v)} textarea />
              <div className="grid grid-cols-2 gap-4">
                <EditField label="Revisions" type="number" value={draft.revisions} onChange={(v) => setD("revisions", Math.max(0, Math.round(Number(v) || 0)))} />
                <EditField label="Total (€)" type="number" value={draft.total} onChange={(v) => setD("total", Math.max(0, Math.round(Number(v) || 0)))} />
              </div>
              <div className="flex gap-2.5">
                <Button onClick={save}>Save new version</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <Row label="Package">{terms.pkg}</Row>
                <Row label="Scope">{terms.scope}</Row>
                <Row label="Deliverables">{terms.deliverables}</Row>
                <Row label="Revisions">{terms.revisions} included</Row>
                <Row label="Total in escrow"><span className="font-mono font-semibold text-white">{money(terms.total)}</span></Row>
              </div>
              <div className="mt-6">
                <Button arrow onClick={startEdit}>
                  Edit contract
                </Button>
              </div>
            </>
          )}
        </Surface>
      </div>

      {/* Version history */}
      <div className="rise" style={{ animationDelay: "120ms" }}>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/45">Version history</h2>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/60">{versions.length}</span>
        </div>
        <p className="mb-4 flex items-center gap-2 text-xs text-white/45">
          <Icon name="lock" size={13} className="text-escrow-green" />
          Every edit is saved as a new version. Nothing is overwritten — both parties see the full trail.
        </p>

        <div className="flex flex-col gap-2.5">
          {history.map((v) => {
            const isCurrent = v.version === versions.length;
            const expanded = openVersion === v.version;
            return (
              <Card key={v.version} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenVersion(expanded ? null : v.version)}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ${isCurrent ? "bg-grid-blue/15 text-aerial-cyan ring-grid-blue/30" : "bg-white/[0.05] text-white/55 ring-white/10"}`}>
                    v{v.version}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-white">{v.note}</span>
                      {isCurrent && <StatusPill tone="escrow">Current</StatusPill>}
                    </div>
                    <div className="text-xs text-white/45">{v.editor} · {formatVersionTime(v.at)}</div>
                  </div>
                  <Icon name="chevron" size={16} className={`shrink-0 text-white/30 transition-transform ${expanded ? "rotate-90" : ""}`} />
                </button>
                {expanded && (
                  <div className="border-t border-white/8 px-4 py-3">
                    <Row label="Package">{v.terms.pkg}</Row>
                    <Row label="Scope">{v.terms.scope}</Row>
                    <Row label="Deliverables">{v.terms.deliverables}</Row>
                    <Row label="Revisions">{v.terms.revisions} included</Row>
                    <Row label="Total"><span className="font-mono font-semibold text-white">{money(v.terms.total)}</span></Row>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
