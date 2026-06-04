import "server-only";

/**
 * Shared append-only audit writer.
 *
 * Best-effort: never blocks or throws into the caller (an audit failure must not
 * fail the user's action). Writes to the immutable `audit_event` table (rows are
 * never updated/deleted; `user_id` → null on account deletion so the record
 * survives). This is the compliance trail; `domain_event` is the automation
 * trigger — keep them separate. (See VAULT_ARCHITECTURE.md §10.)
 */
import { db } from "@/lib/db";
import { auditEvent } from "@/lib/db/schema";

/** Vault/storage audit actions (extend as new event types are added). */
export const AUDIT = {
  UPLOAD: "UPLOAD",
  DOWNLOAD: "DOWNLOAD",
  DELETE: "DELETE",
  MOVE: "MOVE",
  TRANSFER: "TRANSFER",
  SHARE: "SHARE",
  INVITE: "INVITE",
  PERMISSION_CHANGE: "PERMISSION_CHANGE",
  ARCHIVE: "ARCHIVE",
} as const;

function auditId(): string {
  return `ae_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Append an immutable audit event. Best-effort — swallows its own errors. */
export async function logAudit(userId: string | null, action: string, detail?: unknown): Promise<void> {
  try {
    await db.insert(auditEvent).values({
      id: auditId(),
      userId,
      action,
      detail: (detail ?? null) as object | null,
    });
  } catch {
    /* never block the user action on an audit write */
  }
}
