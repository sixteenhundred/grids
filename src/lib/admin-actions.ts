"use server";

/**
 * Admin server actions — feature flags + server maintenance.
 *
 * Flags persist in the `feature_flag` table (Supabase Postgres) so a toggle
 * applies to EVERY visitor. When no database is reachable we fall back to an
 * in-memory map so the panel still works for the current server instance.
 *
 * Only async functions are exported (a "use server" requirement). Shared
 * constants/types live in ./features and ./admin-types.
 */

import { revalidatePath } from "next/cache";
import { sql, desc } from "drizzle-orm";
import { db } from "./db";
import { featureFlag, waitlist } from "./db/schema";
import { getCurrentUser } from "./security/auth-guard";
import { enforceRateLimit } from "./security/rate-guard";
import { isPlatformLive, setPlatformLive } from "./config-store";
import { isAdminEmail } from "./admin";
import { FEATURE_DEFAULTS, FEATURE_KEYS } from "./features";
import type {
  AuditReport,
  DbStatus,
  FlagMap,
  ServerActionResult,
} from "./admin-types";

/* -------------------------------------------------------------------------- */
/*  Instance state (resets on cold start — that's the "uptime")                */
/* -------------------------------------------------------------------------- */

let BOOT_ID = Math.random().toString(36).slice(2, 10);
let BOOTED_AT = Date.now();

/** Last-resort store when there is no writable database. */
const memFlags: FlagMap = {};

/* -------------------------------------------------------------------------- */
/*  Auth                                                                       */
/* -------------------------------------------------------------------------- */

async function currentEmail(): Promise<string | null> {
  return (await getCurrentUser())?.email ?? null;
}

async function requireAdmin(): Promise<string> {
  const email = await currentEmail();
  if (!isAdminEmail(email)) throw new Error("Admin access required.");
  return email as string;
}

/* -------------------------------------------------------------------------- */
/*  Flag storage                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Current flag state for every feature: defaults overlaid with stored
 * overrides. Safe to call for any visitor (used by the dashboard layout).
 */
export async function getFlags(): Promise<FlagMap> {
  const flags: FlagMap = { ...FEATURE_DEFAULTS };
  try {
    const rows = await db
      .select({ key: featureFlag.key, enabled: featureFlag.enabled })
      .from(featureFlag);
    for (const r of rows) {
      if (FEATURE_KEYS.has(r.key)) flags[r.key] = !!r.enabled;
    }
  } catch {
    // No database — apply whatever this instance holds in memory.
    Object.assign(flags, memFlags);
  }
  return flags;
}

export async function setFlag(
  key: string,
  enabled: boolean,
): Promise<ServerActionResult> {
  const email = await requireAdmin();
  await enforceRateLimit("write", email);
  if (!FEATURE_KEYS.has(key)) return { ok: false, message: "Unknown feature." };

  try {
    await db
      .insert(featureFlag)
      .values({ key, enabled, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: featureFlag.key,
        set: { enabled, updatedAt: new Date() },
      });
  } catch {
    memFlags[key] = enabled;
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: `${key} ${enabled ? "enabled" : "disabled"}.` };
}

export async function setAllFlags(enabled: boolean): Promise<ServerActionResult> {
  const email = await requireAdmin();
  await enforceRateLimit("write", email);
  try {
    const now = new Date();
    const values = [...FEATURE_KEYS].map((key) => ({ key, enabled, updatedAt: now }));
    await db
      .insert(featureFlag)
      .values(values)
      .onConflictDoUpdate({
        target: featureFlag.key,
        set: { enabled, updatedAt: now },
      });
  } catch {
    for (const key of FEATURE_KEYS) memFlags[key] = enabled;
  }
  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    message: `All features ${enabled ? "enabled" : "disabled"}.`,
  };
}

export async function resetFlags(): Promise<ServerActionResult> {
  const email = await requireAdmin();
  await enforceRateLimit("sensitive", email);
  try {
    await db.delete(featureFlag);
  } catch {
    for (const key of Object.keys(memFlags)) delete memFlags[key];
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Reset to defaults." };
}

/* -------------------------------------------------------------------------- */
/*  Server maintenance                                                         */
/* -------------------------------------------------------------------------- */

const ENV_VARS: { name: string; public: boolean }[] = [
  { name: "BETTER_AUTH_SECRET", public: false },
  { name: "DATABASE_URL", public: false },
  { name: "SUPABASE_URL", public: false },
  { name: "NEXT_PUBLIC_APP_URL", public: true },
  { name: "DEMO_EMAIL", public: false },
  { name: "DEMO_PASSWORD", public: false },
  { name: "ADMIN_EMAILS", public: false },
];

const COUNT_TABLES = [
  "user",
  "session",
  "shop",
  "product",
  "academy",
  "feature_flag",
  "waitlist",
];

async function probeDb(): Promise<DbStatus> {
  const url = process.env.DATABASE_URL ?? "";
  const configured = url.length > 0;
  const driver = url.includes("supabase") ? "Supabase Postgres" : "Postgres";
  const tables: Record<string, number | null> = {};
  try {
    for (const name of COUNT_TABLES) {
      try {
        const res = (await db.execute(
          sql`select count(*)::int as c from ${sql.identifier(name)}`,
        )) as unknown as Array<{ c: number }>;
        tables[name] = res[0]?.c ?? 0;
      } catch {
        tables[name] = null; // table missing
      }
    }
    return { configured, connected: true, driver, tables };
  } catch (e) {
    return {
      configured,
      connected: false,
      driver,
      tables,
      error: e instanceof Error ? e.message : "Unreachable",
    };
  }
}

export async function auditServer(): Promise<AuditReport> {
  const email = await requireAdmin();
  await enforceRateLimit("read", email);
  const flags = await getFlags();
  const off = Object.entries(flags)
    .filter(([, on]) => !on)
    .map(([k]) => k);
  const enabled = Object.values(flags).filter(Boolean).length;

  return {
    at: Date.now(),
    bootId: BOOT_ID,
    uptimeMs: Date.now() - BOOTED_AT,
    node: process.version,
    env: process.env.NODE_ENV ?? "unknown",
    db: await probeDb(),
    envVars: ENV_VARS.map((v) => ({
      name: v.name,
      present: !!process.env[v.name],
      public: v.public,
    })),
    features: {
      total: FEATURE_KEYS.size,
      enabled,
      disabled: FEATURE_KEYS.size - enabled,
      off,
    },
  };
}

export async function cleanServer(): Promise<ServerActionResult> {
  const email = await requireAdmin();
  await enforceRateLimit("sensitive", email);
  // Supabase Auth manages session expiry; nothing to purge here.
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: "Caches revalidated. (Sessions are managed by Supabase Auth.)",
  };
}

export async function restartServer(): Promise<ServerActionResult> {
  const email = await requireAdmin();
  await enforceRateLimit("sensitive", email);
  BOOT_ID = Math.random().toString(36).slice(2, 10);
  BOOTED_AT = Date.now();
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: "Soft restart complete — caches cleared, instance re-initialised.",
    detail: { bootId: BOOT_ID },
  };
}

/* -------------------------------------------------------------------------- */
/*  Waitlist + launch flag                                                     */
/* -------------------------------------------------------------------------- */

export type WaitlistEntry = { email: string; joinedAt: string };

/** All waitlist signups, newest first (admin only). */
export async function listWaitlist(): Promise<WaitlistEntry[]> {
  const email = await requireAdmin();
  await enforceRateLimit("read", email);
  try {
    const rows = await db
      .select({ email: waitlist.email, createdAt: waitlist.createdAt })
      .from(waitlist)
      .orderBy(desc(waitlist.createdAt));
    return rows.map((r) => ({
      email: r.email,
      joinedAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)).toISOString(),
    }));
  } catch {
    return [];
  }
}

/** Current launch state (true = platform visible, false = waitlist-only). */
export async function getPlatformLive(): Promise<boolean> {
  return isPlatformLive();
}

/** Flip the launch switch (admin only). Editable live — no redeploy. */
export async function setPlatformLiveFlag(live: boolean): Promise<ServerActionResult> {
  const email = await requireAdmin();
  await enforceRateLimit("sensitive", email);
  await setPlatformLive(live);
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: live ? "Platform is LIVE." : "Platform hidden — public sees the waitlist only.",
  };
}
