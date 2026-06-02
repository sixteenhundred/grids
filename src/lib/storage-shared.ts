/**
 * Shared Storage constants safe to import from BOTH server and client.
 * (storage.service.ts is server-only; the browser upload path needs the bucket
 * name too, so it lives here rather than in the server module.)
 */
export const UPLOAD_BUCKET = "uploads";
