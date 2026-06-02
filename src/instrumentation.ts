/**
 * Next.js instrumentation. `onRequestError` forwards server errors to our
 * reporter (which logs, and forwards to Sentry when configured). `register` is
 * a no-op hook point for future tracing/init.
 */
import type { Instrumentation } from "next";

export function register(): void {
  // Reserved for future observability init (e.g. OpenTelemetry).
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  // Avoid logging raw headers (may carry cookies); keep path + method only.
  const { reportError } = await import("./lib/monitoring");
  await reportError(err, { path: request?.path, method: request?.method, ...context });
};
