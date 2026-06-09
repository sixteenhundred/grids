import "server-only";

/**
 * In-app notifications (server helpers). A row with `userId = null` is a
 * BROADCAST visible to every user — used by contest "Promote". Personal rows
 * target a single user. The user-facing feed reads "mine OR broadcast".
 */
import { desc, eq, isNull, or } from "drizzle-orm";
import { db } from "./db";
import { notification } from "./db/schema";

const newId = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

type NotifInput = { type?: string; title: string; body?: string; icon?: string | null; link?: string | null };

/** Fire a notification to ALL users (broadcast). Returns the row id. */
export async function createBroadcastNotification(input: NotifInput): Promise<string> {
  const id = newId("ntf");
  await db.insert(notification).values({
    id,
    userId: null,
    type: input.type ?? "system",
    title: input.title,
    body: input.body ?? "",
    icon: input.icon ?? null,
    link: input.link ?? null,
  });
  return id;
}

/** Fire a notification to a single user. */
export async function createUserNotification(userId: string, input: NotifInput): Promise<string> {
  const id = newId("ntf");
  await db.insert(notification).values({
    id,
    userId,
    type: input.type ?? "system",
    title: input.title,
    body: input.body ?? "",
    icon: input.icon ?? null,
    link: input.link ?? null,
  });
  return id;
}

/** The caller's feed: their personal notifications + all broadcasts, newest first. */
export async function listNotificationsForUser(userId: string, limit = 30) {
  return db
    .select()
    .from(notification)
    .where(or(isNull(notification.userId), eq(notification.userId, userId)))
    .orderBy(desc(notification.createdAt))
    .limit(limit);
}
