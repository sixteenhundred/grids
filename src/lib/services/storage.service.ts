/**
 * Storage service — SCAFFOLD (AWS S3 / Cloudflare R2 — S3-compatible).
 *
 * No `@aws-sdk/*` import exists, so the build stays green without the package.
 * Methods report "unavailable" until activated.
 *
 * ── To ACTIVATE ───────────────────────────────────────────────────────────
 *   1. `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
 *   2. Set S3_REGION, S3_ENDPOINT (R2), S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY,
 *      S3_BUCKET in env.
 *   3. Uncomment the client slot and implement createSignedUploadUrl().
 *   ⚠️ Keep imports COMMENTED until installed (literal dynamic import breaks the build).
 *
 * ── SECURITY ───────────────────────────────────────────────────────────────
 *   • Prefer SIGNED upload URLs so raw credentials never reach the browser.
 *   • Validate file type, size, the caller's permission, and project ownership
 *     server-side BEFORE issuing a signed URL.
 *   • Keep public portfolio assets in a separate bucket/prefix from private
 *     project deliverables.
 */
import { isS3Configured } from "@/lib/env";
import { ServiceUnavailableError } from "./types";

export function storageReady(): boolean {
  return isS3Configured();
}

// async function getS3() {
//   if (!isS3Configured()) throw new ServiceUnavailableError("storage");
//   const { S3Client } = await import("@aws-sdk/client-s3"); // add ONLY after install
//   const e = getServerEnv();
//   return new S3Client({
//     region: e.S3_REGION ?? "auto",
//     endpoint: e.S3_ENDPOINT,
//     credentials: { accessKeyId: e.S3_ACCESS_KEY_ID!, secretAccessKey: e.S3_SECRET_ACCESS_KEY! },
//   });
// }

export type SignedUploadParams = {
  key: string; // server-derived object key (e.g. `deliverables/<projectId>/<uuid>`)
  contentType: string;
  maxBytes: number;
};

/** Returns a short-lived signed PUT URL the browser can upload to directly. */
export async function createSignedUploadUrl(_params: SignedUploadParams): Promise<{ url: string; key: string }> {
  throw new ServiceUnavailableError("storage");
}
