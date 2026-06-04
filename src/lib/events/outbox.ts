import "server-only";

/**
 * Transactional outbox. `emit()` appends a `domain_event` row — pass the active
 * transaction so the event commits atomically with the state change it describes
 * (no "delivered but no event" gaps). A worker (Phase C) drains unprocessed rows
 * and fans out to consumers (scan, thumbnail, AI index). This is the durable
 * upgrade over `after()`. (See VAULT_ARCHITECTURE.md §9.)
 */
import { db } from "@/lib/db";
import { domainEvent } from "@/lib/db/schema";

export const EVENTS = {
  FileUploaded: "FileUploaded",
  FileDelivered: "FileDelivered",
  VaultCreated: "VaultCreated",
  PermissionGranted: "PermissionGranted",
  PermissionRevoked: "PermissionRevoked",
  FileArchived: "FileArchived",
  StorageQuotaExceeded: "StorageQuotaExceeded",
} as const;

export type DomainEventType = (typeof EVENTS)[keyof typeof EVENTS];

/** Anything that can run an insert — the db handle or a transaction. */
type Executor = { insert: typeof db.insert };

function eventId(): string {
  return `evt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Append a domain event. Pass `exec` = the active tx to emit inside the same
 * transaction (preferred); defaults to the shared db handle for standalone emits.
 */
export async function emit(
  type: DomainEventType,
  payload: Record<string, unknown>,
  exec: Executor = db,
): Promise<void> {
  await exec.insert(domainEvent).values({ id: eventId(), type, payload });
}
