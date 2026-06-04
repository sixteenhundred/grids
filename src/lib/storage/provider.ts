import "server-only";

/**
 * StorageProvider — the ONLY surface the app uses to touch object storage.
 *
 * Bytes live under immutable, identity-free keys (`files/{id}`); ownership is a
 * DB pointer (`file.vault_id`), so `move()` is for provider migration ONLY —
 * never for ownership transfer (a transfer is a DB row change, zero storage ops).
 *
 * Impl today: Supabase Storage, service role, private `vaults` bucket (no anon
 * policy). Swap the exported `storageProvider` for an R2/S3 impl later and no
 * call site changes. (See VAULT_ARCHITECTURE.md §4.)
 */
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { VAULT_BUCKET } from "@/lib/storage-shared";
import { ok, fail, type ServiceResult } from "@/lib/services/types";

export type FileMeta = { size: number; mimeType: string };

export interface StorageProvider {
  /** Short-lived signed PUT URL for a direct browser upload to `key`. */
  createSignedUploadUrl(key: string): Promise<ServiceResult<{ url: string; token: string }>>;
  /** Short-lived signed GET URL for a private object. */
  generateSignedUrl(key: string, expiresInSeconds?: number): Promise<ServiceResult<{ url: string }>>;
  /** Server-side upload of bytes to `key`. */
  upload(
    key: string,
    body: Buffer | Uint8Array | ArrayBuffer,
    init?: { contentType?: string },
  ): Promise<ServiceResult<{ key: string }>>;
  /** Object metadata, or null if the object is absent. */
  getMetadata(key: string): Promise<ServiceResult<FileMeta | null>>;
  /** Rename/move within the provider. MIGRATION ONLY — never for ownership transfer. */
  move(fromKey: string, toKey: string): Promise<ServiceResult<void>>;
  /** Delete the object at `key`. */
  delete(key: string): Promise<ServiceResult<void>>;
}

/** Default signed-URL lifetime for vault downloads (VAULT_ARCHITECTURE §11). */
export const VAULT_URL_TTL_SECONDS = 300; // 5 minutes

/** The canonical, immutable object key for a file id. NO identity in the key. */
export const fileStorageKey = (fileId: string): string => `files/${fileId}`;

function ready(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

class SupabaseStorageProvider implements StorageProvider {
  private readonly bucket = VAULT_BUCKET;

  async createSignedUploadUrl(key: string): Promise<ServiceResult<{ url: string; token: string }>> {
    if (!ready()) return fail("unavailable", "Storage is not configured.");
    const supa = createSupabaseAdminClient();
    const { data, error } = await supa.storage.from(this.bucket).createSignedUploadUrl(key);
    if (error || !data) return fail("provider_error", error?.message ?? "Could not create upload URL.");
    return ok({ url: data.signedUrl, token: data.token });
  }

  async generateSignedUrl(
    key: string,
    expiresInSeconds = VAULT_URL_TTL_SECONDS,
  ): Promise<ServiceResult<{ url: string }>> {
    if (!ready()) return fail("unavailable", "Storage is not configured.");
    const supa = createSupabaseAdminClient();
    const { data, error } = await supa.storage.from(this.bucket).createSignedUrl(key, expiresInSeconds);
    if (error || !data) return fail("provider_error", error?.message ?? "Could not create download URL.");
    return ok({ url: data.signedUrl });
  }

  async upload(
    key: string,
    body: Buffer | Uint8Array | ArrayBuffer,
    init?: { contentType?: string },
  ): Promise<ServiceResult<{ key: string }>> {
    if (!ready()) return fail("unavailable", "Storage is not configured.");
    const supa = createSupabaseAdminClient();
    const { error } = await supa.storage
      .from(this.bucket)
      .upload(key, body, { contentType: init?.contentType ?? "application/octet-stream", upsert: false });
    if (error) return fail("provider_error", error.message);
    return ok({ key });
  }

  async getMetadata(key: string): Promise<ServiceResult<FileMeta | null>> {
    if (!ready()) return fail("unavailable", "Storage is not configured.");
    const supa = createSupabaseAdminClient();
    const slash = key.lastIndexOf("/");
    const folder = slash >= 0 ? key.slice(0, slash) : "";
    const name = slash >= 0 ? key.slice(slash + 1) : key;
    const { data, error } = await supa.storage.from(this.bucket).list(folder, { search: name, limit: 100 });
    if (error) return fail("provider_error", error.message);
    const entry = data?.find((o) => o.name === name);
    if (!entry) return ok(null);
    const meta = (entry.metadata ?? null) as { size?: number; mimetype?: string } | null;
    return ok({ size: meta?.size ?? 0, mimeType: meta?.mimetype ?? "application/octet-stream" });
  }

  async move(fromKey: string, toKey: string): Promise<ServiceResult<void>> {
    if (!ready()) return fail("unavailable", "Storage is not configured.");
    const supa = createSupabaseAdminClient();
    const { error } = await supa.storage.from(this.bucket).move(fromKey, toKey);
    if (error) return fail("provider_error", error.message);
    return ok(undefined);
  }

  async delete(key: string): Promise<ServiceResult<void>> {
    if (!ready()) return fail("unavailable", "Storage is not configured.");
    const supa = createSupabaseAdminClient();
    const { error } = await supa.storage.from(this.bucket).remove([key]);
    if (error) return fail("provider_error", error.message);
    return ok(undefined);
  }
}

/** The active provider. Swap this single line to migrate storage providers. */
export const storageProvider: StorageProvider = new SupabaseStorageProvider();
