import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Better Auth core tables.
 *
 * These are generated/kept in sync via `npx @better-auth/cli generate`.
 * Application tables (projects, contracts, jobs, etc.) live below the divider
 * and reference `user.id`.
 */

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

/* -------------------------------------------------------------------------- */
/*  GRID application tables                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A minimal `profile` row per user — extends the auth `user` with the
 * creative-platform fields GRID needs (handle, role, bio). Add more app
 * tables (projects, contracts, jobs, products, …) here as features land.
 */
export const profile = sqliteTable("profile", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  handle: text("handle").unique(),
  // 'creative' | 'client' | 'crew' — kept as free text for now.
  role: text("role").notNull().default("creative"),
  bio: text("bio"),
  location: text("location"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/**
 * A creator's storefront — one per user. Holds branding + chosen layout.
 * Images (logo, banner) are stored as data URLs; product files live as
 * metadata only until a blob store is wired up.
 */
export const shop = sqliteTable("shop", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Your Shop"),
  description: text("description").notNull().default(""),
  logo: text("logo"),
  banner: text("banner"),
  // 'grid' | 'spotlight' | 'list'
  layout: text("layout").notNull().default("grid"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** A digital product (LUT, preset, template, pack, photo) sold in a shop. */
export const product = sqliteTable("product", {
  id: text("id").primaryKey(),
  shopId: text("shop_id")
    .notNull()
    .references(() => shop.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull().default(0),
  // 'LUT' | 'Preset' | 'Template' | 'Pack' | 'Photo'
  type: text("type").notNull().default("Preset"),
  coverImage: text("cover_image"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** A buyer's purchase of a product — powers the buyer "owned" state. */
export const purchase = sqliteTable("purchase", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  price: integer("price").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/* -------------------------------------------------------------------------- */
/*  Grid Academy — school → path → lesson                                      */
/* -------------------------------------------------------------------------- */

/** A creator's school — one per user. */
export const academy = sqliteTable("academy", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Your Academy"),
  description: text("description").notNull().default(""),
  logo: text("logo"),
  banner: text("banner"),
  // One-time price for full access. 0 = free.
  price: integer("price").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** A learner's paid access to a (priced) academy. */
export const academyEnrollment = sqliteTable("academy_enrollment", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  academyId: text("academy_id")
    .notNull()
    .references(() => academy.id, { onDelete: "cascade" }),
  price: integer("price").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** A learning path (course track) inside an academy. */
export const learningPath = sqliteTable("learning_path", {
  id: text("id").primaryKey(),
  academyId: text("academy_id")
    .notNull()
    .references(() => academy.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  // 'Beginner' | 'Intermediate' | 'Advanced'
  level: text("level").notNull().default("Beginner"),
  coverImage: text("cover_image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** A single lesson within a path. */
export const lesson = sqliteTable("lesson", {
  id: text("id").primaryKey(),
  pathId: text("path_id")
    .notNull()
    .references(() => learningPath.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  duration: text("duration").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** Tracks which lessons a learner has completed. */
export const lessonProgress = sqliteTable("lesson_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lesson.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const schema = {
  user,
  session,
  account,
  verification,
  profile,
  shop,
  product,
  purchase,
  academy,
  academyEnrollment,
  learningPath,
  lesson,
  lessonProgress,
};
