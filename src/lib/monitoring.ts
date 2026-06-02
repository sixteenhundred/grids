import "server-only";

/**
 * Error reporting. Always logs server-side; additionally forwards to Sentry when
 * `SENTRY_DSN` is set AND `@sentry/nextjs` is installed. The Sentry import uses a
 * computed specifier so a missing optional dependency never breaks the build —
 * it simply no-ops until you `npm i @sentry/nextjs` and set SENTRY_DSN.
 */
import { isSentryConfigured, getServerEnv } from "./env";

type ErrorContext = Record<string, unknown>;

export async function reportError(error: unknown, context?: ErrorContext): Promise<void> {
  // Structured server log — present even without Sentry.
  console.error("[error]", error instanceof Error ? error.stack ?? error.message : error, context ?? {});

  if (!isSentryConfigured()) return;
  try {
    // Specifier from runtime env (defaulted) so the bundler doesn't resolve the
    // optional package at build time — inert until `npm i @sentry/nextjs`.
    const specifier = getServerEnv().SENTRY_PKG;
    const Sentry = (await import(specifier)) as {
      captureException?: (e: unknown, ctx?: unknown) => void;
    };
    Sentry.captureException?.(error, context ? { extra: context } : undefined);
  } catch {
    /* package not installed — log-only is the floor */
  }
}
