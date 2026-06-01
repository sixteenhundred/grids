"use server";

/**
 * Waitlist email registry.
 *
 * Persists signups to the `waitlist` table (lazy `CREATE TABLE IF NOT EXISTS`,
 * so it works with no migration on local SQLite or Turso). When no database is
 * reachable it falls back to an in-memory set so the page still confirms.
 */

import { sql } from "drizzle-orm";
import { db } from "./db";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let tableReady = false;
const memEmails = new Set<string>();

async function ensureTable(): Promise<void> {
  if (tableReady) return;
  await db.run(
    sql`CREATE TABLE IF NOT EXISTS waitlist (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      city TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`,
  );
  tableReady = true;
}

export async function joinWaitlist(
  rawEmail: string,
): Promise<{ ok: boolean; message: string; already?: boolean }> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL.test(email)) {
    return { ok: false, message: "Please enter a valid email." };
  }

  try {
    await ensureTable();
    const existing = await db.get<{ c: number }>(
      sql`SELECT count(*) AS c FROM waitlist WHERE email = ${email}`,
    );
    if (existing && existing.c > 0) {
      return { ok: true, already: true, message: "You're already on the list." };
    }
    const id = `wl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    await db.run(
      sql`INSERT INTO waitlist (id, email, created_at)
          VALUES (${id}, ${email}, ${Math.floor(Date.now() / 1000)})
          ON CONFLICT(email) DO NOTHING`,
    );
    return { ok: true, message: "You're on the list." };
  } catch {
    // No database — confirm against the in-memory set for this instance.
    if (memEmails.has(email)) {
      return { ok: true, already: true, message: "You're already on the list." };
    }
    memEmails.add(email);
    return { ok: true, message: "You're on the list." };
  }
}
