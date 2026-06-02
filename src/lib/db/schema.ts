import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Postgres (Supabase) schema.
 *
 * Auth is Supabase Auth (`auth.users`). `public.user` is a MIRROR of each auth
 * user (kept in sync by a DB trigger) so the existing app-table `userId` FKs
 * resolve without repointing them at the `auth` schema. Better Auth's
 * session/account/verification tables were removed (Supabase manages sessions).
 */

/** Mirror of auth.users — id = auth.uid() (as text). Synced by trigger. */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/* -------------------------------------------------------------------------- */
/*  GRID application tables                                                    */
/* -------------------------------------------------------------------------- */

export const profile = pgTable("profile", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  handle: text("handle").unique(),
  // 'creative' | 'client' | 'crew'
  role: text("role").notNull().default("creative"),
  bio: text("bio"),
  location: text("location"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/** A creator's storefront — one per user. */
export const shop = pgTable("shop", {
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
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/** A digital product (LUT, preset, template, pack, photo) sold in a shop. */
export const product = pgTable("product", {
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
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/** A buyer's purchase of a product — powers the buyer "owned" state. */
export const purchase = pgTable("purchase", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  price: integer("price").notNull().default(0),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/* -------------------------------------------------------------------------- */
/*  Grid Academy — school → path → lesson                                      */
/* -------------------------------------------------------------------------- */

export const academy = pgTable("academy", {
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
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const academyEnrollment = pgTable("academy_enrollment", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  academyId: text("academy_id")
    .notNull()
    .references(() => academy.id, { onDelete: "cascade" }),
  price: integer("price").notNull().default(0),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const learningPath = pgTable("learning_path", {
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
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const lesson = pgTable("lesson", {
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
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const lessonProgress = pgTable("lesson_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lesson.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/* -------------------------------------------------------------------------- */
/*  Admin — site-wide feature flags                                            */
/* -------------------------------------------------------------------------- */

export const featureFlag = pgTable("feature_flag", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/** Pre-launch waitlist signups (public /waitlist page). */
export const waitlist = pgTable("waitlist", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  city: text("city"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const schema = {
  user,
  featureFlag,
  waitlist,
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
