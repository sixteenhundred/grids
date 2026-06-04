/**
 * Shared Storage constants safe to import from BOTH server and client.
 * (storage.service.ts is server-only; the browser upload path needs the bucket
 * name too, so it lives here rather than in the server module.)
 */
export const UPLOAD_BUCKET = "uploads";

/**
 * Vault files live in a SEPARATE, service-role-only bucket with NO anon policy.
 * Keys are immutable + identity-free (`files/{id}`); access is always a
 * server-minted signed URL after a can() check. (See VAULT_ARCHITECTURE.md.)
 */
export const VAULT_BUCKET = "vaults";
