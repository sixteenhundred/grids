/**
 * Service-layer contracts shared by every integration service.
 *
 * Services return a normalized `ServiceResult<T>` (never raw provider errors),
 * so API routes/actions can translate to safe HTTP responses without leaking
 * provider internals to the client.
 */

export type ServiceErrorCode =
  | "unavailable" // integration not configured on this deployment
  | "unauthorized"
  | "rate_limited"
  | "invalid_input"
  | "provider_error"
  | "internal";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ServiceErrorCode; error: string };

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  constructor(code: ServiceErrorCode, message: string) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
  }
}

/** Thrown by an integration scaffold whose API key / SDK is not configured yet. */
export class ServiceUnavailableError extends ServiceError {
  constructor(service: string) {
    super("unavailable", `The "${service}" integration is not configured on this deployment.`);
    this.name = "ServiceUnavailableError";
  }
}

export const ok = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
export const fail = (code: ServiceErrorCode, error: string): ServiceResult<never> => ({ ok: false, code, error });
