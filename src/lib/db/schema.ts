import {
  pgTable,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
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
  // Marketplace display fields (creator profile). `displayName` overrides the
  // auth name for the public card; `published` gates appearance in /browse.
  displayName: text("display_name"),
  specialty: text("specialty"),
  // primary 'Photo'|'Video'|'Drone'|'Production'|'Editing'|'Crew'
  cat: text("cat").notNull().default("Photo"),
  // TalentCategory[] for browse filtering
  categories: jsonb("categories").notNull().default([]),
  // listed day-rate (creator-set listing price, like product.price; NOT a charge)
  rate: integer("rate").notNull().default(0),
  available: boolean("available").notNull().default(false),
  verified: boolean("verified").notNull().default(false),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
}, (t) => [
  // listCreators filters on published, newest first.
  index("profile_published_idx").on(t.published),
]);

/** A creator's portfolio image (bytes in private Storage; served via signed URL). */
export const portfolioItem = pgTable("portfolio_item", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  imagePath: text("image_path").notNull(),
  fileSize: integer("file_size").notNull().default(0),
  title: text("title").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
}, (t) => [index("portfolio_user_id_idx").on(t.userId)]);

/**
 * A creator's bookable package. `price` is the creator's own listed price (same
 * category as product.price) — charge/escrow/payout LOGIC stays in Phase 3.
 */
export const creatorPackage = pgTable("creator_package", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  price: integer("price").notNull().default(0),
  detail: text("detail").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
}, (t) => [index("cpackage_user_id_idx").on(t.userId)]);

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
}, (t) => [
  index("product_shop_id_idx").on(t.shopId),
  index("product_user_id_idx").on(t.userId),
]);

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
}, (t) => [
  index("purchase_user_id_idx").on(t.userId),
  index("purchase_product_id_idx").on(t.productId),
]);

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
}, (t) => [
  index("enrollment_user_id_idx").on(t.userId),
  index("enrollment_academy_id_idx").on(t.academyId),
]);

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
}, (t) => [
  index("path_academy_id_idx").on(t.academyId),
  index("path_user_id_idx").on(t.userId),
]);

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
}, (t) => [
  index("lesson_path_id_idx").on(t.pathId),
  index("lesson_user_id_idx").on(t.userId),
]);

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
}, (t) => [
  index("progress_user_id_idx").on(t.userId),
  index("progress_lesson_id_idx").on(t.lessonId),
]);

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
}, (t) => [
  index("contract_creator_id_idx").on(t.creatorId),
  index("contract_client_id_idx").on(t.clientId),
]);

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
}, (t) => [
  index("cversion_contract_id_idx").on(t.contractId),
  index("cversion_editor_id_idx").on(t.editorId),
]);

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
}, (t) => [
  index("review_subject_id_idx").on(t.subjectId),
  index("review_author_id_idx").on(t.authorId),
]);

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
}, (t) => [
  index("dispute_contract_id_idx").on(t.contractId),
  index("dispute_opened_by_id_idx").on(t.openedById),
]);

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
  // CAN-SPAM: opaque per-signup token powers a no-login unsubscribe link
  // (no email in the URL). `unsubscribedAt` is the suppression flag.
  unsubscribeToken: text("unsubscribe_token"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
}, (t) => [index("waitlist_unsubscribe_token_idx").on(t.unsubscribeToken)]);

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
  // Vault ledger (NON-MONEY accounting; billing/overage is Phase D / Rule 1).
  transferBytes: bigint("transfer_bytes", { mode: "number" }).notNull().default(0),
  archiveBytes: bigint("archive_bytes", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/**
 * Append-only audit trail. The app never updates or deletes these rows; user
 * deletion sets `user_id` to null so the event survives as a retained record
 * (data-rights requests must remain provable). Server-only on the API surface.
 */
export const auditEvent = pgTable("audit_event", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  detail: jsonb("detail"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
}, (t) => [index("audit_user_id_idx").on(t.userId)]);

/** Per-user consent state (cookies / AI / marketing). Withdrawable any time. */
export const consent = pgTable("consent", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  cookies: boolean("cookies").notNull().default(false),
  ai: boolean("ai").notNull().default(false),
  marketing: boolean("marketing").notNull().default(false),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/* -------------------------------------------------------------------------- */
/*  Vault system — ownership-based content storage (see VAULT_ARCHITECTURE.md)  */
/*                                                                              */
/*  Bytes live once in object storage under an immutable `files/{id}` key;      */
/*  ownership is a DB pointer (`file.vault_id`). Transfer re-points the row —    */
/*  no byte copy. Authz is `can(user, vault, action)` in code; RLS locks the    */
/*  browser surface. MONEY (billing/overage/tiers) is OUT — Phase D (Rule 1).   */
/* -------------------------------------------------------------------------- */

/** A storage container. Files belong to vaults; users hold permissions on vaults. */
export const vault = pgTable("vault", {
  id: text("id").primaryKey(),
  // 'personal' | 'project' | 'content' | 'team' | 'archive'
  type: text("type").notNull(),
  // Current owner. For a CONTENT vault this is the client (set on delivery).
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  // Content vaults attach to the originating booking (nullable).
  contractId: text("contract_id").references(() => contract.id, { onDelete: "set null" }),
  // 'active' | 'archived'
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
}, (t) => [
  index("vault_owner_id_idx").on(t.ownerId),
  index("vault_contract_id_idx").on(t.contractId),
]);

/** A file's metadata. Bytes live in object storage at the immutable `storageKey`. */
export const file = pgTable("file", {
  id: text("id").primaryKey(),
  vaultId: text("vault_id")
    .notNull()
    .references(() => vault.id, { onDelete: "cascade" }),
  // Immutable, identity-free object key: `files/{id}`. Transfer never changes it.
  storageKey: text("storage_key").notNull(),
  // Which StorageProvider holds the bytes: 'supabase' today; 'r2'|'s3' later.
  provider: text("provider").notNull().default("supabase"),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull().default("application/octet-stream"),
  // sha256 — powers duplicate detection / lineage later.
  checksum: text("checksum"),
  size: bigint("size", { mode: "number" }).notNull().default(0),
  // Bytes survive the uploader's account deletion (client owns delivered assets).
  uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
  // 'uploading' | 'ready' | 'archived' | 'deleted' (soft delete preserves lineage)
  status: text("status").notNull().default("uploading"),
  // Version history (future): the file this one supersedes.
  replacesFileId: text("replaces_file_id"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
}, (t) => [
  index("file_vault_id_idx").on(t.vaultId),
  index("file_checksum_idx").on(t.checksum),
]);

/** A user's role on a vault. can() reads these. One row per (vault, user). */
export const vaultPermission = pgTable("vault_permission", {
  id: text("id").primaryKey(),
  vaultId: text("vault_id")
    .notNull()
    .references(() => vault.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // 'owner' | 'admin' | 'editor' | 'contributor' | 'viewer'
  role: text("role").notNull().default("viewer"),
  grantedBy: text("granted_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
}, (t) => [
  uniqueIndex("vperm_vault_user_uq").on(t.vaultId, t.userId),
  index("vperm_user_id_idx").on(t.userId),
]);

/** A pending invitation to a vault (opaque token, like the waitlist unsubscribe). */
export const vaultInvite = pgTable("vault_invite", {
  id: text("id").primaryKey(),
  vaultId: text("vault_id")
    .notNull()
    .references(() => vault.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  // 'owner' | 'admin' | 'editor' | 'contributor' | 'viewer'
  role: text("role").notNull().default("viewer"),
  token: text("token").notNull().unique(),
  invitedBy: text("invited_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // 'pending' | 'accepted' | 'revoked' | 'expired'
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
}, (t) => [
  index("vinvite_vault_id_idx").on(t.vaultId),
  index("vinvite_token_idx").on(t.token),
]);

/**
 * Transactional outbox. Domain events are written in the SAME tx as the state
 * change; a worker drains unprocessed rows and fans out (scan, thumbnail, index).
 * Separate from `audit_event` (the immutable compliance record).
 */
export const domainEvent = pgTable("domain_event", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull(),
  processedAt: timestamp("processed_at"),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
}, (t) => [index("event_unprocessed_idx").on(t.processedAt)]);

export const schema = {
  user,
  auditEvent,
  consent,
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
  portfolioItem,
  creatorPackage,
  contract,
  contractVersion,
  review,
  dispute,
  appConfig,
  subscription,
  usage,
  vault,
  file,
  vaultPermission,
  vaultInvite,
  domainEvent,
};
