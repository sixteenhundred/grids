/**
 * Client-safe environment.
 *
 * ONLY `NEXT_PUBLIC_*` variables, each referenced as a STATIC literal so Next
 * inlines its value into the browser bundle at build time. Safe to import from
 * client components — it contains no server secrets. Never add a non-public var
 * here, and never read NEXT_PUBLIC_* dynamically (e.g. process.env[name]) or it
 * won't be inlined.
 */
import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

// All-optional → this never throws, so a module-eval parse is safe here.
export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
});

export type ClientEnv = typeof clientEnv;
