import "server-only";

/**
 * Vault authorization — the SINGLE gate for every vault action.
 *
 * The app's Drizzle bypasses RLS, so this is the real boundary (RLS only locks
 * the browser/PostgREST surface). Authz is permission-driven: a user's role on a
 * vault lives in `vault_permission` (the owner gets an 'owner' row on creation),
 * and `can()` maps role → action. Storage keys carry no identity, so there is no
 * path to guess around this. (See VAULT_ARCHITECTURE.md §5.)
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { vaultPermission } from "@/lib/db/schema";

export type VaultRole = "owner" | "admin" | "editor" | "contributor" | "viewer";

export type VaultAction =
  | "view"
  | "download"
  | "upload"
  | "delete"
  | "move"
  | "archive"
  | "share"
  | "invite"
  | "transfer";

/** Higher rank = more capability. */
const RANK: Record<VaultRole, number> = {
  viewer: 0,
  contributor: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

/** Minimum role required to perform each action (least privilege). */
const REQUIRED: Record<VaultAction, VaultRole> = {
  view: "viewer",
  download: "viewer",
  upload: "contributor",
  delete: "editor",
  move: "editor",
  archive: "admin",
  share: "admin",
  invite: "admin",
  transfer: "owner",
};

/** The caller's role on a vault, or null if they have none. */
export async function roleOn(userId: string, vaultId: string): Promise<VaultRole | null> {
  const row = await db
    .select({ role: vaultPermission.role })
    .from(vaultPermission)
    .where(and(eq(vaultPermission.vaultId, vaultId), eq(vaultPermission.userId, userId)))
    .limit(1)
    .then((r) => r[0]);
  return (row?.role as VaultRole | undefined) ?? null;
}

/** True if `userId` may perform `action` on `vaultId`. */
export async function can(userId: string, vaultId: string, action: VaultAction): Promise<boolean> {
  const role = await roleOn(userId, vaultId);
  if (!role) return false;
  return RANK[role] >= RANK[REQUIRED[action]];
}

/** Thrown when a vault authorization check fails. `status` lets routes map to 403. */
export class VaultAccessError extends Error {
  readonly status = 403;
  constructor(message = "You don't have access to this vault.") {
    super(message);
    this.name = "VaultAccessError";
  }
}

/** Assert the caller may perform `action` on `vaultId`; throws VaultAccessError(403). */
export async function requireVaultAccess(
  userId: string,
  vaultId: string,
  action: VaultAction,
): Promise<void> {
  if (!(await can(userId, vaultId, action))) throw new VaultAccessError();
}
