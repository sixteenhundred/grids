"use server";

/**
 * Home-feed pins (1b). Admin pins a contest or a post to the top of the home
 * feed for ALL users; pin/unpin/reorder. `getHomePins` is the public resolver
 * the home page renders (it joins live contests + mock community posts).
 */
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { requireAdmin } from "./security/auth-guard";
import { db } from "./db";
import { homePin, contest } from "./db/schema";
import { POSTS } from "./grid-data";

const genId = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const VISIBLE = ["live", "closed", "finalized"];

function fmtPrize(minor: number, currency = "eur"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(minor / 100);
  } catch {
    return `€${Math.round(minor / 100)}`;
  }
}

export type HomePinView = {
  id: string;
  itemType: "contest" | "post";
  itemId: string;
  title: string;
  subtitle: string;
  badge: string;
  href: string;
};

/** Public: resolved pins for the home feed, in display order. */
export async function getHomePins(): Promise<HomePinView[]> {
  const pins = await db.select().from(homePin).orderBy(asc(homePin.position));
  if (!pins.length) return [];

  const contestIds = pins.filter((p) => p.itemType === "contest").map((p) => p.itemId);
  const contests = contestIds.length ? await db.select().from(contest).where(inArray(contest.id, contestIds)) : [];
  const cmap = new Map(contests.map((c) => [c.id, c]));

  const out: HomePinView[] = [];
  for (const p of pins) {
    if (p.itemType === "contest") {
      const c = cmap.get(p.itemId);
      if (!c || !VISIBLE.includes(c.status)) continue; // hide drafts / removed contests
      out.push({
        id: p.id,
        itemType: "contest",
        itemId: c.id,
        title: c.title,
        subtitle: c.description?.slice(0, 140) || "Enter to win a share of the prize.",
        badge: `${fmtPrize(c.prizeAmount, c.currency)} prize`,
        href: `/dashboard/contests/${c.id}`,
      });
    } else {
      const post = POSTS.find((x) => x.id === p.itemId);
      if (!post) continue;
      out.push({
        id: p.id,
        itemType: "post",
        itemId: p.itemId,
        title: `@${post.by}`,
        subtitle: post.caption,
        badge: "Featured",
        href: "/dashboard/community",
      });
    }
  }
  return out;
}

export type AdminPinRow = { id: string; itemType: string; itemId: string; position: number; label: string };

/** Admin: pins in order, with a human label for the manager UI. */
export async function listHomePinsAdmin(): Promise<AdminPinRow[]> {
  await requireAdmin();
  const pins = await db.select().from(homePin).orderBy(asc(homePin.position));
  const contestIds = pins.filter((p) => p.itemType === "contest").map((p) => p.itemId);
  const contests = contestIds.length ? await db.select({ id: contest.id, title: contest.title }).from(contest).where(inArray(contest.id, contestIds)) : [];
  const cmap = new Map(contests.map((c) => [c.id, c.title]));
  return pins.map((p) => ({
    id: p.id,
    itemType: p.itemType,
    itemId: p.itemId,
    position: p.position,
    label:
      p.itemType === "contest"
        ? cmap.get(p.itemId) ?? "(removed contest)"
        : `@${POSTS.find((x) => x.id === p.itemId)?.by ?? p.itemId}`,
  }));
}

/** Admin: which items are currently pinned (keys like "contest:abc"). */
export async function pinnedKeys(): Promise<string[]> {
  await requireAdmin();
  const pins = await db.select({ t: homePin.itemType, i: homePin.itemId }).from(homePin);
  return pins.map((p) => `${p.t}:${p.i}`);
}

export async function pinToHome(itemType: "contest" | "post", itemId: string): Promise<void> {
  await requireAdmin();
  const [m] = await db.select({ mx: sql<number>`coalesce(max(${homePin.position}), -1)` }).from(homePin);
  const position = Number(m?.mx ?? -1) + 1;
  await db.insert(homePin).values({ id: genId("pin"), itemType, itemId, position }).onConflictDoNothing();
}

export async function unpinFromHome(itemType: string, itemId: string): Promise<void> {
  await requireAdmin();
  await db.delete(homePin).where(and(eq(homePin.itemType, itemType), eq(homePin.itemId, itemId)));
}

/** Admin: swap a pin with its neighbour to reorder. */
export async function movePin(id: string, dir: "up" | "down"): Promise<void> {
  await requireAdmin();
  const pins = await db.select().from(homePin).orderBy(asc(homePin.position));
  const i = pins.findIndex((p) => p.id === id);
  if (i < 0) return;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= pins.length) return;
  const a = pins[i];
  const b = pins[j];
  await db.transaction(async (tx) => {
    await tx.update(homePin).set({ position: b.position }).where(eq(homePin.id, a.id));
    await tx.update(homePin).set({ position: a.position }).where(eq(homePin.id, b.id));
  });
}
