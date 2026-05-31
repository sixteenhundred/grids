/**
 * Contract terms + immutable version history (localStorage).
 *
 * Every save appends a new version — previous versions are never overwritten,
 * so both parties can see exactly what changed, when, and by whom. A real
 * deployment would store this server-side with both parties' signatures; the
 * append-only shape here mirrors that audit trail.
 */

import type { Contract } from "./grid-data";

export type ContractTerms = {
  pkg: string;
  scope: string;
  deliverables: string;
  revisions: number;
  total: number;
};

export type ContractVersion = {
  version: number;
  editor: string;
  at: number;
  note: string;
  terms: ContractTerms;
};

const keyFor = (id: string) => `grid:contract:${id}`;

export function seedTerms(c: Contract): ContractTerms {
  return {
    pkg: c.pkg,
    scope: `Professional ${c.pkg.toLowerCase()} production for ${c.withName}, booked and protected through Grid Escrow.`,
    deliverables: "Final edited media in web + print resolution, delivered via Grid. Licensed for the client's marketing use.",
    revisions: 2,
    total: c.total,
  };
}

export function loadVersions(c: Contract): ContractVersion[] {
  if (typeof window === "undefined") return [{ version: 1, editor: c.withName, at: Date.now(), note: "Contract created", terms: seedTerms(c) }];
  try {
    const raw = localStorage.getItem(keyFor(c.id));
    if (raw === null) {
      const v1: ContractVersion = { version: 1, editor: c.withName, at: Date.now(), note: "Contract created", terms: seedTerms(c) };
      return [v1];
    }
    return JSON.parse(raw) as ContractVersion[];
  } catch {
    return [{ version: 1, editor: c.withName, at: Date.now(), note: "Contract created", terms: seedTerms(c) }];
  }
}

export function saveVersions(id: string, versions: ContractVersion[]): void {
  try {
    localStorage.setItem(keyFor(id), JSON.stringify(versions));
  } catch {
    /* ignore */
  }
}

export function currentTerms(versions: ContractVersion[]): ContractTerms {
  return versions[versions.length - 1].terms;
}

/** Human summary of what changed between two term sets. */
export function diffNote(prev: ContractTerms, next: ContractTerms): string {
  const changed: string[] = [];
  if (prev.pkg !== next.pkg) changed.push("package");
  if (prev.scope !== next.scope) changed.push("scope");
  if (prev.deliverables !== next.deliverables) changed.push("deliverables");
  if (prev.revisions !== next.revisions) changed.push("revisions");
  if (prev.total !== next.total) changed.push("price");
  if (changed.length === 0) return "No changes";
  return `Updated ${changed.join(", ")}`;
}

export function formatVersionTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
