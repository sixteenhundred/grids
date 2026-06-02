import "server-only";

/**
 * DB-backed config (CMS) — edit live without redeploy. Holds launch flags and
 * editable copy. MONEY (prices/charged amounts) is NOT stored here; it stays in
 * code/Stripe. Reads default gracefully when the row/DB is absent.
 */
import { eq } from "drizzle-orm";
import { db } from "./db";
import { appConfig } from "./db/schema";

export const PLATFORM_LIVE_KEY = "platform_live";

export async function getConfigValue<T>(key: string, fallback: T): Promise<T> {
  try {
    const [row] = await db
      .select({ value: appConfig.value })
      .from(appConfig)
      .where(eq(appConfig.key, key))
      .limit(1);
    return row ? (row.value as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function setConfigValue(
  key: string,
  value: unknown,
  meta?: { label?: string; category?: string },
): Promise<void> {
  await db
    .insert(appConfig)
    .values({ key, value, label: meta?.label, category: meta?.category, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appConfig.key,
      set: { value, updatedAt: new Date() },
    });
}

/** Launch switch. Default TRUE (platform visible) until explicitly turned off. */
export async function isPlatformLive(): Promise<boolean> {
  return getConfigValue<boolean>(PLATFORM_LIVE_KEY, true);
}

export async function setPlatformLive(live: boolean): Promise<void> {
  await setConfigValue(PLATFORM_LIVE_KEY, live, { label: "Platform live", category: "launch" });
}
