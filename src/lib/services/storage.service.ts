import "server-only";

/**
 * Storage service — Supabase Storage, gated by the per-profile quota.
 *
 * Object keys are namespaced by user id: `${userId}/${category}/${ts}-${name}`,
 * so the storage RLS policy can scope access by `auth.uid()`. Server uploads use
 * the service role (bypasses storage RLS) but ALWAYS go through the quota first.
 * For direct browser uploads use `createSignedUploadUrl` (size pre-checked).
 *
 * SECURITY: keep raw credentials server-side; validate size/ownership before
 * issuing a signed URL; private deliverables live behind signed download URLs.
 */
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { reserveStorage, releaseStorage, checkFileSize } from "@/lib/quota";
import { UPLOAD_BUCKET } from "@/lib/storage-shared";
import { ok, fail, type ServiceResult } from "./types";

export const BUCKET = UPLOAD_BUCKET;

export function storageReady(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

const keyFor = (userId: string, category: string, name: string) =>
  `${userId}/${category}/${Date.now()}-${name.replace(/[^\w.\-]+/g, "_")}`;

/** Server-side upload (service role). Reserves quota first; rolls back on failure. */
export async function uploadObject(params: {
  userId: string;
  category: string;
  name: string;
  bytes: number;
  contentType: string;
  body: Buffer | Uint8Array | ArrayBuffer;
}): Promise<ServiceResult<{ path: string }>> {
  if (!storageReady()) return fail("unavailable", "Storage is not configured.");
  const reserved = await reserveStorage(params.userId, params.bytes);
  if (!reserved.ok) return fail("invalid_input", reserved.reason);

  const path = keyFor(params.userId, params.category, params.name);
  const supa = createSupabaseAdminClient();
  const { error } = await supa.storage
    .from(BUCKET)
    .upload(path, params.body, { contentType: params.contentType, upsert: false });
  if (error) {
    await releaseStorage(params.userId, params.bytes);
    return fail("provider_error", error.message);
  }
  return ok({ path });
}

/** Short-lived signed PUT URL for direct browser upload (size pre-checked). */
export async function createSignedUploadUrl(params: {
  userId: string;
  category: string;
  name: string;
  bytes: number;
}): Promise<ServiceResult<{ url: string; token: string; path: string }>> {
  if (!storageReady()) return fail("unavailable", "Storage is not configured.");
  const sized = checkFileSize(params.bytes);
  if (!sized.ok) return fail("invalid_input", sized.reason);

  const path = keyFor(params.userId, params.category, params.name);
  const supa = createSupabaseAdminClient();
  const { data, error } = await supa.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return fail("provider_error", error?.message ?? "Could not create upload URL.");
  return ok({ url: data.signedUrl, token: data.token, path });
}

/** Signed, expiring download URL for a private object. */
export async function getSignedDownloadUrl(
  path: string,
  expiresIn = 3600,
): Promise<ServiceResult<{ url: string }>> {
  if (!storageReady()) return fail("unavailable", "Storage is not configured.");
  const supa = createSupabaseAdminClient();
  const { data, error } = await supa.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data) return fail("provider_error", error?.message ?? "Could not create download URL.");
  return ok({ url: data.signedUrl });
}

/** Remove an object from the bucket WITHOUT touching quota (orphan cleanup). */
export async function removeObject(path: string): Promise<void> {
  const supa = createSupabaseAdminClient();
  await supa.storage.from(BUCKET).remove([path]).catch(() => {});
}

/** Delete an object and free its quota. */
export async function deleteObject(userId: string, path: string, bytes: number): Promise<void> {
  await removeObject(path);
  await releaseStorage(userId, bytes);
}

/**
 * True if `path` is under the caller's OWN uid folder (and has no traversal).
 * Object keys are `${userId}/${category}/…`, so this rejects a client that passes
 * another user's object key back to a record action (#2 BOLA).
 */
export function isOwnedObjectPath(userId: string, path: string): boolean {
  return !path.includes("..") && path.startsWith(`${userId}/`);
}

/**
 * Actual stored size (bytes) of an object, so quota is billed by the REAL object
 * size rather than a client-supplied number (#5 quota bypass). Fails if absent.
 */
export async function getObjectSize(path: string): Promise<ServiceResult<number>> {
  if (!storageReady()) return fail("unavailable", "Storage is not configured.");
  const supa = createSupabaseAdminClient();
  const slash = path.lastIndexOf("/");
  const folder = slash >= 0 ? path.slice(0, slash) : "";
  const name = slash >= 0 ? path.slice(slash + 1) : path;
  const { data, error } = await supa.storage.from(BUCKET).list(folder, { search: name, limit: 100 });
  if (error) return fail("provider_error", error.message);
  const entry = data?.find((o) => o.name === name);
  const size = (entry?.metadata as { size?: number } | null | undefined)?.size;
  if (typeof size !== "number") return fail("invalid_input", "Uploaded object not found.");
  return ok(size);
}

/**
 * Remove ALL objects under a user's `${userId}/…` prefix. The auth-user delete
 * cascades DB rows but NOT storage objects, so account deletion calls this for
 * genuine erasure (#6). Best-effort; walks one level of category folders.
 */
export async function removeUserObjects(userId: string): Promise<void> {
  if (!storageReady()) return;
  const supa = createSupabaseAdminClient();
  const top = await supa.storage.from(BUCKET).list(userId, { limit: 1000 });
  const paths: string[] = [];
  for (const entry of top.data ?? []) {
    const isFile = (entry.metadata as { size?: number } | null | undefined)?.size != null;
    if (isFile) {
      paths.push(`${userId}/${entry.name}`);
      continue;
    }
    const sub = await supa.storage.from(BUCKET).list(`${userId}/${entry.name}`, { limit: 1000 });
    for (const f of sub.data ?? []) paths.push(`${userId}/${entry.name}/${f.name}`);
  }
  if (paths.length) await supa.storage.from(BUCKET).remove(paths).catch(() => {});
}
