"use server";

/**
 * Admin server actions — feature flags + server maintenance.
 *
 * Flags persist in the `feature_flag` table so a toggle applies to EVERY
 * visitor of the deployment. When no database is reachable (e.g. the pure
 * demo with no Turso) we fall back to an in-memory map so the panel still
 * works for the current server instance.
 *
 * Only async functions are exported (a "use server" requirement). Shared
 * constants/types live in ./features and ./admin-types.
 */

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { auth } from "./auth";
import { hasDemoSession } from "./demo-auth";
import { DEMO_USER } from "./demo";
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
let flagTableReady = false;

/* -------------------------------------------------------------------------- */
/*  Auth                                                                       */
/* -------------------------------------------------------------------------- */

async function currentEmail(): Promise<string | null> {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (session?.user?.email) return session.user.email;
  if (await hasDemoSession()) return DEMO_USER.email;
  return null;
}

async function requireAdmin(): Promise<string> {
  const email = await currentEmail();
  if (!isAdminEmail(email)) throw new Error("Admin access required.");
  return email as string;
}

/* -------------------------------------------------------------------------- */
/*  Flag storage                                                               */
/* -------------------------------------------------------------------------- */

async function ensureFlagTable(): Promise<void> {
  if (flagTableReady) return;
  await db.run(
    sql`CREATE TABLE IF NOT EXISTS feature_flag (
      key TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`,
  );
  flagTableReady = true;
}

/**
 * Current flag state for every feature: defaults overlaid with stored
 * overrides. Safe to call for any visitor (used by the dashboard layout).
 */
export async function getFlags(): Promise<FlagMap> {
  const flags: FlagMap = { ...FEATURE_DEFAULTS };
  try {
    await ensureFlagTable();
    const rows = await db.all<{ key: string; enabled: number }>(
      sql`SELECT key, enabled FROM feature_flag`,
    );
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
  await requireAdmin();
  if (!FEATURE_KEYS.has(key)) return { ok: false, message: "Unknown feature." };

  try {
    await ensureFlagTable();
    await db.run(
      sql`INSERT INTO feature_flag (key, enabled, updated_at)
          VALUES (${key}, ${enabled ? 1 : 0}, ${Math.floor(Date.now() / 1000)})
          ON CONFLICT(key) DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at`,
    );
  } catch {
    memFlags[key] = enabled;
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: `${key} ${enabled ? "enabled" : "disabled"}.` };
}

export async function setAllFlags(enabled: boolean): Promise<ServerActionResult> {
  await requireAdmin();
  for (const key of FEATURE_KEYS) {
    try {
      await ensureFlagTable();
      await db.run(
        sql`INSERT INTO feature_flag (key, enabled, updated_at)
            VALUES (${key}, ${enabled ? 1 : 0}, ${Math.floor(Date.now() / 1000)})
            ON CONFLICT(key) DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at`,
      );
    } catch {
      memFlags[key] = enabled;
    }
  }
  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    message: `All features ${enabled ? "enabled" : "disabled"}.`,
  };
}

export async function resetFlags(): Promise<ServerActionResult> {
  await requireAdmin();
  try {
    await ensureFlagTable();
    await db.run(sql`DELETE FROM feature_flag`);
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
  { name: "DATABASE_AUTH_TOKEN", public: false },
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
  const driver = url.startsWith("libsql")
    ? "Turso / libSQL"
    : "SQLite (file)";
  const tables: Record<string, number | null> = {};
  try {
    await ensureFlagTable();
    for (const name of COUNT_TABLES) {
      try {
        const row = await db.get<{ c: number }>(
          sql.raw(`SELECT count(*) AS c FROM "${name}"`),
        );
        tables[name] = row?.c ?? 0;
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
  await requireAdmin();
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
  await requireAdmin();
  let expiredSessionsRemoved = 0;
  try {
    await db.run(
      sql`DELETE FROM session WHERE expires_at < ${Math.floor(Date.now() / 1000)}`,
    );
    const row = await db.get<{ c: number }>(
      sql`SELECT changes() AS c`,
    );
    expiredSessionsRemoved = row?.c ?? 0;
  } catch {
    // No DB — nothing to clean there.
  }
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: "Caches revalidated, expired sessions cleared.",
    detail: { expiredSessionsRemoved },
  };
}

export async function restartServer(): Promise<ServerActionResult> {
  await requireAdmin();
  BOOT_ID = Math.random().toString(36).slice(2, 10);
  BOOTED_AT = Date.now();
  flagTableReady = false; // re-verify schema on next access
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: "Soft restart complete — caches cleared, instance re-initialised.",
    detail: { bootId: BOOT_ID },
  };
}
