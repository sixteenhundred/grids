import "server-only";

/**
 * Per-profile storage quotas — 50 GB total, 5 GB per file. Enforced against the
 * `usage` table transactionally (atomic conditional upsert) so two concurrent
 * uploads can't both pass a stale check. Wire `reserveStorage` into the upload
 * path before accepting a file; call `releaseStorage` on delete.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { usage } from "./db/schema";

export const MAX_STORAGE_BYTES = 50 * 1024 * 1024 * 1024; // 50 GB
export const MAX_FILE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB per file/transfer

export type QuotaResult = { ok: true } | { ok: false; reason: string };

export async function getUsage(userId: string): Promise<{ storageBytes: number; fileCount: number }> {
  try {
    const [row] = await db
      .select({ storageBytes: usage.storageBytes, fileCount: usage.fileCount })
      .from(usage)
      .where(eq(usage.userId, userId))
      .limit(1);
    return row ?? { storageBytes: 0, fileCount: 0 };
  } catch {
    return { storageBytes: 0, fileCount: 0 };
  }
}

export function checkFileSize(bytes: number): QuotaResult {
  if (!Number.isFinite(bytes) || bytes < 0) return { ok: false, reason: "Invalid file size." };
  if (bytes > MAX_FILE_BYTES) return { ok: false, reason: "File exceeds the 5 GB per-file limit." };
  return { ok: true };
}

/**
 * Atomically reserve `bytes` for `userId`. Fails if it would exceed 50 GB.
 * Returns ok only when the reservation was actually recorded.
 */
export async function reserveStorage(userId: string, bytes: number): Promise<QuotaResult> {
  const sized = checkFileSize(bytes);
  if (!sized.ok) return sized;
  try {
    const rows = (await db.execute(sql`
      insert into usage (user_id, storage_bytes, file_count, updated_at)
      values (${userId}, ${bytes}, 1, now())
      on conflict (user_id) do update
        set storage_bytes = usage.storage_bytes + ${bytes},
            file_count = usage.file_count + 1,
            updated_at = now()
        where usage.storage_bytes + ${bytes} <= ${MAX_STORAGE_BYTES}
      returning storage_bytes
    `)) as unknown as Array<{ storage_bytes: number }>;
    if (!rows[0]) return { ok: false, reason: "Storage limit reached (50 GB)." };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Quota error." };
  }
}

export async function releaseStorage(userId: string, bytes: number): Promise<void> {
  await db.execute(sql`
    update usage
      set storage_bytes = greatest(0, storage_bytes - ${bytes}),
          file_count = greatest(0, file_count - 1),
          updated_at = now()
      where user_id = ${userId}
  `);
}
