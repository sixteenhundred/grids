"use server";

/**
 * Creator profile — database-backed (replaces the hardcoded CREATIVES mock).
 *
 * Owner side: getMyProfile / saveMyProfile + portfolio image upload + packages.
 * Public side: listCreators (the /browse marketplace) / getCreator (detail).
 *
 * Marketplace reads go through these server actions (Drizzle, which bypasses
 * RLS) and select only public fields, so the raw `profile` PostgREST surface
 * stays owner-locked. Portfolio image bytes live in the private Storage bucket;
 * they are served as short-lived signed URLs generated here.
 *
 * MONEY: a package `price` is the creator's own listed rate (same category as
 * product.price) — charge/escrow/payout LOGIC stays in Phase 3 (Stripe).
 */

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { requireUser as requireAuth } from "./security/auth-guard";
import { ensureUserRow } from "./demo-user";
import { db } from "./db";
import { profile, portfolioItem, creatorPackage, review, user } from "./db/schema";
import {
  createSignedUploadUrl,
  getSignedDownloadUrl,
  deleteObject,
  removeObject,
} from "./services/storage.service";
import { reserveStorage, checkFileSize, getUsage, MAX_STORAGE_BYTES } from "./quota";
import { rateLimit } from "./security/rate-limit";
import type { Creative, Review, Tile, Category } from "./grid-data";

// Input size caps (defence against oversized/abusive payloads).
const CAP = { name: 80, specialty: 80, city: 80, bio: 4000, pkgName: 80, pkgDetail: 300, review: 4000, fileName: 300 } as const;
const cap = (s: string, n: number) => s.slice(0, n);

type ProfileRow = typeof profile.$inferSelect;

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function requireUser() {
  const u = await requireAuth();
  await ensureUserRow(u);
  return u;
}

/* -------------------------------------------------------------------------- */
/*  Mapping helpers                                                            */
/* -------------------------------------------------------------------------- */

// Deterministic on-brand gradient stand-in (used as the card background and as
// a fallback when a portfolio slot has no uploaded image).
const PALETTES: Array<[string, string]> = [
  ["#1b2a4a", "#0a0c12"],
  ["#3a2438", "#0d0a10"],
  ["#163a3a", "#08100f"],
  ["#2a2233", "#0c0a10"],
  ["#1f3350", "#090c12"],
  ["#243a2c", "#080f0b"],
];
function synthTile(seed: string): Tile {
  const i = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTES.length;
  return { title: "", from: PALETTES[i][0], to: PALETTES[i][1] };
}

async function reviewAgg(userId: string): Promise<{ count: number; avg: number }> {
  const [row] = await db
    .select({ count: sql<number>`count(*)`, avg: sql<number>`coalesce(avg(${review.rating}), 0)` })
    .from(review)
    .where(eq(review.subjectId, userId));
  return { count: Number(row?.count ?? 0), avg: Number(row?.avg ?? 0) };
}

/** Build the public Creative DTO from a profile row (+ its name and signed images). */
function toCreative(
  p: ProfileRow,
  name: string,
  images: string[],
  packages: { name: string; price: number; detail: string }[],
  agg: { count: number; avg: number },
): Creative {
  const id = p.handle ?? p.userId;
  const tiles: Tile[] = images.length ? images.map(() => synthTile(id)) : [synthTile(id)];
  return {
    id,
    name,
    type: p.specialty || "Creative",
    cat: (p.cat as Category) || "Photo",
    categories: (p.categories as Creative["categories"]) ?? [],
    city: p.location ?? "",
    distanceKm: 0,
    rate: p.rate,
    rating: Math.round(agg.avg * 10) / 10,
    reviews: agg.count,
    verified: p.verified,
    available: p.available,
    bio: p.bio ?? "",
    packages,
    portfolio: tiles,
    portfolioImages: images.length ? images : [],
  };
}

async function signedPortfolio(userId: string): Promise<{ urls: string[]; titles: string[] }> {
  const items = await db
    .select()
    .from(portfolioItem)
    .where(eq(portfolioItem.userId, userId))
    .orderBy(asc(portfolioItem.position), asc(portfolioItem.createdAt));
  const urls: string[] = [];
  const titles: string[] = [];
  for (const it of items) {
    const res = await getSignedDownloadUrl(it.imagePath);
    if (res.ok) {
      urls.push(res.data.url);
      titles.push(it.title);
    }
  }
  return { urls, titles };
}

async function packagesFor(userId: string) {
  const rows = await db
    .select()
    .from(creatorPackage)
    .where(eq(creatorPackage.userId, userId))
    .orderBy(asc(creatorPackage.position), asc(creatorPackage.createdAt));
  return rows.map((r) => ({ id: r.id, name: r.name, price: r.price, detail: r.detail }));
}

/* -------------------------------------------------------------------------- */
/*  Owner                                                                      */
/* -------------------------------------------------------------------------- */

async function ensureProfileRow(userId: string): Promise<ProfileRow> {
  const existing = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1).then((r) => r[0]);
  if (existing) return existing;
  const id = genId("pf");
  const now = new Date();
  await db.insert(profile).values({ id, userId, role: "creative", createdAt: now, updatedAt: now });
  return (await db.select().from(profile).where(eq(profile.id, id)).limit(1).then((r) => r[0]))!;
}

export type MyProfile = {
  name: string;
  specialty: string;
  city: string;
  rate: number;
  bio: string;
  cat: Category;
  categories: string[];
  available: boolean;
  published: boolean;
  verified: boolean;
  portfolio: { id: string; url: string; title: string }[];
  packages: { id: string; name: string; price: number; detail: string }[];
  reviews: Review[];
  rating: number;
  reviewCount: number;
};

export async function getMyProfile(): Promise<MyProfile> {
  const u = await requireUser();
  const p = await ensureProfileRow(u.id);
  const items = await db
    .select()
    .from(portfolioItem)
    .where(eq(portfolioItem.userId, u.id))
    .orderBy(asc(portfolioItem.position), asc(portfolioItem.createdAt));
  const portfolio: { id: string; url: string; title: string }[] = [];
  for (const it of items) {
    const res = await getSignedDownloadUrl(it.imagePath);
    if (res.ok) portfolio.push({ id: it.id, url: res.data.url, title: it.title });
  }
  const [packages, reviews, agg] = await Promise.all([
    packagesFor(u.id),
    listReviews(u.id),
    reviewAgg(u.id),
  ]);
  return {
    name: p.displayName ?? u.name,
    specialty: p.specialty ?? "",
    city: p.location ?? "",
    rate: p.rate,
    bio: p.bio ?? "",
    cat: (p.cat as Category) || "Photo",
    categories: (p.categories as string[]) ?? [],
    available: p.available,
    published: p.published,
    verified: p.verified,
    portfolio,
    packages,
    reviews,
    rating: Math.round(agg.avg * 10) / 10,
    reviewCount: agg.count,
  };
}

export async function saveMyProfile(input: {
  name: string;
  specialty: string;
  city: string;
  rate: number;
  bio: string;
  cat?: Category;
  categories?: string[];
  available?: boolean;
  published?: boolean;
}): Promise<void> {
  const u = await requireUser();
  await ensureProfileRow(u.id);
  await db
    .update(profile)
    .set({
      displayName: cap(input.name.trim(), CAP.name) || u.name,
      specialty: cap(input.specialty.trim(), CAP.specialty),
      location: cap(input.city.trim(), CAP.city),
      rate: Math.max(0, Math.round(input.rate)),
      bio: cap(input.bio.trim(), CAP.bio),
      ...(input.cat ? { cat: input.cat } : {}),
      ...(input.categories ? { categories: input.categories } : {}),
      ...(input.available != null ? { available: input.available } : {}),
      ...(input.published != null ? { published: input.published } : {}),
      updatedAt: new Date(),
    })
    .where(eq(profile.userId, u.id));
}

/* -------------------------------------------------------------------------- */
/*  Portfolio images (private Storage)                                         */
/* -------------------------------------------------------------------------- */

export async function createPortfolioUploadUrl(
  name: string,
  size: number,
): Promise<{ path: string; token: string }> {
  const u = await requireUser();
  if (!rateLimit(`upload:${u.id}`, { limit: 60, windowMs: 15 * 60_000 }).ok) {
    throw new Error("Too many uploads. Please wait a few minutes.");
  }
  if (name.length > CAP.fileName) throw new Error("File name is too long.");
  const sized = checkFileSize(size);
  if (!sized.ok) throw new Error(sized.reason);
  const { storageBytes } = await getUsage(u.id);
  if (storageBytes + size > MAX_STORAGE_BYTES) throw new Error("Storage limit reached (50 GB).");
  const res = await createSignedUploadUrl({ userId: u.id, category: "portfolio", name: cap(name, CAP.fileName), bytes: size });
  if (!res.ok) throw new Error(res.error);
  return { path: res.data.path, token: res.data.token };
}

export async function addPortfolioItem(input: {
  path: string;
  size: number;
  title?: string;
}): Promise<{ id: string; url: string; title: string }> {
  const u = await requireUser();
  const reserved = await reserveStorage(u.id, input.size);
  if (!reserved.ok) {
    await removeObject(input.path);
    throw new Error(reserved.reason);
  }
  const id = genId("pi");
  const countRow = await db
    .select({ n: sql<number>`count(*)` })
    .from(portfolioItem)
    .where(eq(portfolioItem.userId, u.id))
    .limit(1)
    .then((r) => r[0]);
  try {
    await db.insert(portfolioItem).values({
      id,
      userId: u.id,
      imagePath: input.path,
      fileSize: input.size,
      title: (input.title ?? "").trim(),
      position: Number(countRow?.n ?? 0),
      createdAt: new Date(),
    });
  } catch (e) {
    await deleteObject(u.id, input.path, input.size);
    throw e;
  }
  const res = await getSignedDownloadUrl(input.path);
  return { id, url: res.ok ? res.data.url : "", title: (input.title ?? "").trim() };
}

export async function removePortfolioItem(id: string): Promise<void> {
  const u = await requireUser();
  const it = await db
    .select()
    .from(portfolioItem)
    .where(and(eq(portfolioItem.id, id), eq(portfolioItem.userId, u.id)))
    .limit(1)
    .then((r) => r[0]);
  if (!it) return;
  await db.delete(portfolioItem).where(and(eq(portfolioItem.id, id), eq(portfolioItem.userId, u.id)));
  await deleteObject(u.id, it.imagePath, it.fileSize);
}

/* -------------------------------------------------------------------------- */
/*  Packages                                                                   */
/* -------------------------------------------------------------------------- */

export async function savePackages(
  list: { name: string; price: number; detail: string }[],
): Promise<void> {
  const u = await requireUser();
  await db.delete(creatorPackage).where(eq(creatorPackage.userId, u.id));
  if (!list.length) return;
  await db.insert(creatorPackage).values(
    list.slice(0, 12).map((p, i) => ({
      id: genId("pk"),
      userId: u.id,
      name: cap(p.name.trim(), CAP.pkgName),
      price: Math.max(0, Math.round(p.price)),
      detail: cap(p.detail.trim(), CAP.pkgDetail),
      position: i,
      createdAt: new Date(),
    })),
  );
}

/* -------------------------------------------------------------------------- */
/*  Reviews                                                                    */
/* -------------------------------------------------------------------------- */

async function listReviews(subjectUserId: string): Promise<Review[]> {
  const rows = await db
    .select({ rating: review.rating, body: review.body, by: user.name })
    .from(review)
    .innerJoin(user, eq(review.authorId, user.id))
    .where(eq(review.subjectId, subjectUserId))
    .orderBy(desc(review.createdAt));
  return rows.map((r) => ({ by: r.by, rating: r.rating, text: r.body }));
}

export async function addReview(subjectId: string, rating: number, body: string): Promise<void> {
  const u = await requireUser();
  if (subjectId === u.id) throw new Error("You can't review your own profile.");
  if (!rateLimit(`review:${u.id}`, { limit: 10, windowMs: 60 * 60_000 }).ok) {
    throw new Error("Too many reviews. Please slow down.");
  }
  await db.insert(review).values({
    id: genId("rv"),
    subjectId,
    subjectType: "creative",
    authorId: u.id,
    rating: Math.min(5, Math.max(1, Math.round(rating))),
    body: cap(body.trim(), CAP.review),
    createdAt: new Date(),
  });
}

/* -------------------------------------------------------------------------- */
/*  Public marketplace                                                         */
/* -------------------------------------------------------------------------- */

/** Published creators for the /browse marketplace (empty until creators join). */
export async function listCreators(): Promise<Creative[]> {
  await requireUser(); // marketplace lives behind the dashboard
  const rows = await db
    .select({ p: profile, name: user.name })
    .from(profile)
    .innerJoin(user, eq(profile.userId, user.id))
    .where(eq(profile.published, true))
    .orderBy(desc(profile.updatedAt));
  const out: Creative[] = [];
  for (const { p, name } of rows) {
    const [{ urls }, agg] = await Promise.all([signedPortfolio(p.userId), reviewAgg(p.userId)]);
    out.push(toCreative(p, p.displayName ?? name, urls, [], agg));
  }
  return out;
}

/** A single creator by handle or user id (published, or the owner previewing). */
export async function getCreator(idOrHandle: string): Promise<Creative | null> {
  const row = await db
    .select({ p: profile, name: user.name })
    .from(profile)
    .innerJoin(user, eq(profile.userId, user.id))
    .where(sql`${profile.handle} = ${idOrHandle} or ${profile.userId} = ${idOrHandle}`)
    .limit(1)
    .then((r) => r[0]);
  if (!row) return null;
  const { p, name } = row;
  if (!p.published) {
    // Only the owner can view an unpublished profile.
    const u = await requireAuth().catch(() => null);
    if (!u || u.id !== p.userId) return null;
  }
  const [{ urls }, packages, agg] = await Promise.all([
    signedPortfolio(p.userId),
    packagesFor(p.userId),
    reviewAgg(p.userId),
  ]);
  return toCreative(
    p,
    p.displayName ?? name,
    urls,
    packages.map((pk) => ({ name: pk.name, price: pk.price, detail: pk.detail })),
    agg,
  );
}

/** Reviews for a creator (by handle or user id) for the detail page. */
export async function getCreatorReviews(idOrHandle: string): Promise<Review[]> {
  const row = await db
    .select({ userId: profile.userId })
    .from(profile)
    .where(sql`${profile.handle} = ${idOrHandle} or ${profile.userId} = ${idOrHandle}`)
    .limit(1)
    .then((r) => r[0]);
  if (!row) return [];
  return listReviews(row.userId);
}
