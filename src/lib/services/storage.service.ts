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
import { ok, fail, type ServiceResult } from "./types";

export const BUCKET = "uploads";

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

/** Delete an object and free its quota. */
export async function deleteObject(userId: string, path: string, bytes: number): Promise<void> {
  const supa = createSupabaseAdminClient();
  await supa.storage.from(BUCKET).remove([path]).catch(() => {});
  await releaseStorage(userId, bytes);
}
