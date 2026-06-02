import {
  pgTable,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  jsonb,
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
  // Supabase Storage object key for the actual deliverable (private bucket).
  filePath: text("file_path"),
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
/*  Bookings / contracts / reviews / disputes (relational data)                */
/*                                                                             */
/*  MONEY IS DELIBERATELY ABSENT here. Agreed amounts, escrow holds, payouts,  */
/*  refunds and charges are modelled in Phase 3 alongside the Stripe/escrow    */
/*  ledger so there is ONE source of truth for money (Rule 1). These tables    */
/*  hold only the non-money relational record (parties, terms text, status).   */
/* -------------------------------------------------------------------------- */

/** A booking/agreement between a creator and a client (the "contract"). */
export const contract = pgTable("contract", {
  id: text("id").primaryKey(),
  creatorId: text("creator_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // null until a client countersigns / is attached.
  clientId: text("client_id").references(() => user.id, { onDelete: "set null" }),
  packageName: text("package_name").notNull().default(""),
  scope: text("scope").notNull().default(""),
  deliverables: text("deliverables").notNull().default(""),
  revisions: integer("revisions").notNull().default(0),
  // 'Awaiting signature' | 'Active' | 'Completed'
  status: text("status").notNull().default("Awaiting signature"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/** Append-only version history of a contract's terms (audit trail). */
export const contractVersion = pgTable("contract_version", {
  id: text("id").primaryKey(),
  contractId: text("contract_id")
    .notNull()
    .references(() => contract.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  editorId: text("editor_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  note: text("note").notNull().default(""),
  packageName: text("package_name").notNull().default(""),
  scope: text("scope").notNull().default(""),
  deliverables: text("deliverables").notNull().default(""),
  revisions: integer("revisions").notNull().default(0),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/** A review left for a creative or a company by a real user. */
export const review = pgTable("review", {
  id: text("id").primaryKey(),
  // who is being reviewed (a user id) and which side they are.
  subjectId: text("subject_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // 'creative' | 'company'
  subjectType: text("subject_type").notNull().default("creative"),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull().default(5),
  body: text("body").notNull().default(""),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/**
 * A dispute opened against a contract. Non-money scaffold for Phase 3: refund
 * amounts and any reversal logic live with the Stripe/escrow ledger, not here.
 */
export const dispute = pgTable("dispute", {
  id: text("id").primaryKey(),
  contractId: text("contract_id")
    .notNull()
    .references(() => contract.id, { onDelete: "cascade" }),
  openedById: text("opened_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // 'open' | 'in_review' | 'resolved' | 'appealed'
  status: text("status").notNull().default("open"),
  reason: text("reason").notNull().default(""),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
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

/* -------------------------------------------------------------------------- */
/*  Platform config (DB-backed CMS) + subscriptions + usage quotas             */
/* -------------------------------------------------------------------------- */

/**
 * Editable-without-redeploy config (CMS). One row per key; `value` is JSON.
 * Holds launch flags (e.g. platform_live), editable copy, tier *display* text.
 * MONEY (prices, charged amounts) stays in code/Stripe — never here.
 */
export const appConfig = pgTable("app_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  label: text("label"),
  category: text("category"),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/**
 * A user's subscription tier — the source of truth for entitlements. Written by
 * the Stripe webhook (Phase 3) on checkout/renew/cancel; read by the server
 * entitlements service. `plan` defaults to "free".
 */
export const subscription = pgTable("subscription", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("free"),
  status: text("status").notNull().default("active"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end"),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/** Per-profile storage usage, enforced against the 50 GB / 5 GB-per-file caps. */
export const usage = pgTable("usage", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  storageBytes: bigint("storage_bytes", { mode: "number" }).notNull().default(0),
  fileCount: integer("file_count").notNull().default(0),
  updatedAt: timestamp("updated_at")
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
  contract,
  contractVersion,
  review,
  dispute,
  appConfig,
  subscription,
  usage,
};
