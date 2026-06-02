"use server";

/**
 * Grid Shop — server actions (database-backed).
 *
 * Seller side: getMyShop / updateShopConfig / createProduct / removeProduct.
 * Buyer side:  listProducts / getShopById / listShops / purchaseProduct /
 *              listMyPurchases.
 *
 * Every product file/image lives in SQLite for now (images as data URLs).
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { requireUser as requireAuth } from "./security/auth-guard";
import { requireFeatureAccess } from "./entitlements";
import { DEMO_MODE } from "./client/config";
import { ensureUserRow } from "./demo-user";
import { db } from "./db";
import { shop, product, purchase } from "./db/schema";
import {
  DEFAULT_CONFIG,
  SEED_PRODUCTS,
  tileForType,
  type ShopConfig,
  type ShopProduct,
  type ShopSummary,
  type ShopLayout,
  type ProductKind,
  type NewProduct,
} from "./shop";

type ProductRow = typeof product.$inferSelect;
type ShopRow = typeof shop.$inferSelect;

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function requireUser() {
  const u = await requireAuth(); // Supabase session; throws AuthError(401) if none
  await ensureUserRow(u); // mirror row for FK-backed inserts (belt-and-suspenders)
  return u;
}

/** Running a shop is the gated "shop" feature; buying from one is NOT. */
async function requireShopOwner() {
  const u = await requireUser();
  await requireFeatureAccess(u.id, "shop"); // throws AuthError(403) below plan; no-op in demo
  return u;
}

function toProduct(row: ProductRow, shopName: string): ShopProduct {
  const type = row.type as ProductKind;
  return {
    id: row.id,
    shopId: row.shopId,
    shopName,
    title: row.title,
    description: row.description,
    price: row.price,
    type,
    coverImage: row.coverImage,
    coverTile: tileForType(type),
    fileName: row.fileName,
    fileSize: row.fileSize,
    createdAt: row.createdAt.getTime(),
  };
}

function toConfig(s: ShopRow): ShopConfig {
  return {
    name: s.name,
    description: s.description,
    logo: s.logo,
    banner: s.banner,
    layout: s.layout as ShopLayout,
  };
}

/** Get the caller's shop, creating + seeding it on first visit. */
async function ensureShopRow(userId: string, userName?: string | null): Promise<ShopRow> {
  const existing = await db.select().from(shop).where(eq(shop.userId, userId)).limit(1).then((r) => r[0]);
  if (existing) return existing;

  const id = genId("shop");
  const now = new Date();
  const first = userName?.trim().split(" ")[0];
  await db.insert(shop).values({
    id,
    userId,
    name: first ? `${first}'s Shop` : DEFAULT_CONFIG.name,
    description: DEFAULT_CONFIG.description,
    layout: DEFAULT_CONFIG.layout,
    createdAt: now,
    updatedAt: now,
  });

  // Seed example products ONLY in demo mode. At launch (DEMO_MODE=false) a new
  // shop starts empty — no sample/seed rows reach the production DB (Rule 3).
  if (DEMO_MODE) {
    const base = Date.now();
    await db.insert(product).values(
      SEED_PRODUCTS.map((p, i) => ({
        id: genId("prod"),
        shopId: id,
        userId,
        title: p.title,
        description: p.description,
        price: p.price,
        type: p.type,
        coverImage: p.coverImage,
        fileName: p.fileName,
        fileSize: p.fileSize,
        createdAt: new Date(base - i * 1000),
      })),
    );
  }

  return (await db.select().from(shop).where(eq(shop.id, id)).limit(1).then((r) => r[0]))!;
}

/* -------------------------------------------------------------------------- */
/*  Seller                                                                     */
/* -------------------------------------------------------------------------- */

export async function getMyShop(): Promise<{ shopId: string; config: ShopConfig; products: ShopProduct[] }> {
  const u = await requireShopOwner();
  const s = await ensureShopRow(u.id, u.name);
  const rows = await db.select().from(product).where(eq(product.shopId, s.id)).orderBy(desc(product.createdAt));
  return { shopId: s.id, config: toConfig(s), products: rows.map((r) => toProduct(r, s.name)) };
}

export async function updateShopConfig(config: ShopConfig): Promise<void> {
  const u = await requireShopOwner();
  const s = await ensureShopRow(u.id, u.name);
  await db
    .update(shop)
    .set({
      name: config.name.trim() || DEFAULT_CONFIG.name,
      description: config.description,
      logo: config.logo,
      banner: config.banner,
      layout: config.layout,
      updatedAt: new Date(),
    })
    .where(eq(shop.id, s.id));
}

export async function createProduct(input: NewProduct): Promise<ShopProduct> {
  const u = await requireShopOwner();
  const s = await ensureShopRow(u.id, u.name);
  const id = genId("prod");
  await db.insert(product).values({
    id,
    shopId: s.id,
    userId: u.id,
    title: input.title.trim(),
    description: input.description.trim(),
    price: Math.max(0, Math.round(input.price)),
    type: input.type,
    coverImage: input.coverImage,
    fileName: input.fileName,
    fileSize: input.fileSize,
    createdAt: new Date(),
  });
  const row = (await db.select().from(product).where(eq(product.id, id)).limit(1).then((r) => r[0]))!;
  return toProduct(row, s.name);
}

export async function removeProduct(id: string): Promise<void> {
  const u = await requireShopOwner();
  await db.delete(product).where(and(eq(product.id, id), eq(product.userId, u.id)));
}

/* -------------------------------------------------------------------------- */
/*  Buyer                                                                      */
/* -------------------------------------------------------------------------- */

/** Every product across all shops, newest first. */
export async function listProducts(): Promise<ShopProduct[]> {
  const rows = await db
    .select({ p: product, shopName: shop.name })
    .from(product)
    .innerJoin(shop, eq(product.shopId, shop.id))
    .orderBy(desc(product.createdAt));
  return rows.map(({ p, shopName }) => toProduct(p, shopName));
}

/** Every shop with a product count, for the directory. */
export async function listShops(): Promise<ShopSummary[]> {
  const rows = await db
    .select({
      id: shop.id,
      name: shop.name,
      description: shop.description,
      logo: shop.logo,
      banner: shop.banner,
      layout: shop.layout,
      productCount: sql<number>`count(${product.id})`,
    })
    .from(shop)
    .leftJoin(product, eq(product.shopId, shop.id))
    .groupBy(shop.id)
    .orderBy(desc(shop.createdAt));
  return rows.map((r) => ({ ...r, layout: r.layout as ShopLayout, productCount: Number(r.productCount) }));
}

export async function getShopById(
  shopId: string,
): Promise<{ shopId: string; config: ShopConfig; products: ShopProduct[] } | null> {
  const s = await db.select().from(shop).where(eq(shop.id, shopId)).limit(1).then((r) => r[0]);
  if (!s) return null;
  const rows = await db.select().from(product).where(eq(product.shopId, s.id)).orderBy(desc(product.createdAt));
  return { shopId: s.id, config: toConfig(s), products: rows.map((r) => toProduct(r, s.name)) };
}

export async function purchaseProduct(productId: string): Promise<void> {
  const u = await requireUser();
  const already = await db
    .select()
    .from(purchase)
    .where(and(eq(purchase.userId, u.id), eq(purchase.productId, productId)))
    .limit(1).then((r) => r[0]);
  if (already) return;
  const prod = await db.select().from(product).where(eq(product.id, productId)).limit(1).then((r) => r[0]);
  if (!prod) throw new Error("Product not found.");
  await db.insert(purchase).values({
    id: genId("buy"),
    userId: u.id,
    productId,
    price: prod.price,
    createdAt: new Date(),
  });
}

export async function listMyPurchases(): Promise<string[]> {
  const u = await requireUser();
  const rows = await db.select({ productId: purchase.productId }).from(purchase).where(eq(purchase.userId, u.id));
  return rows.map((r) => r.productId);
}
