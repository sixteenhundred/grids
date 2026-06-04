# GRID — Vault System Architecture (DESIGN — pending sign-off)

> **Status: DRAFT for review.** No code or schema has been written yet. This doc
> is the agreed design; once signed off, **Phase A** (foundation) gets built.
> Read `HANDOFF.md` first for the stack. Cross-refs: `SECURITY_AUDIT.md`
> (findings #1/#2, which this fixes), `SCALE.md`, `FEATURE_ROADMAP.md` (Phase 3 =
> money). Last updated: 2026-06-04.

## 0. Non-negotiables (the 3 rules apply)

- **Money is sacred (Rule 1).** The **billing/overage/tiering engine is OUT of
  scope** for everything except a usage *ledger* (byte accounting = measurement,
  not charging). No prices, no overage math, no charges until the owner signs off
  money decisions. Billing = **Phase D**, alongside Stripe (Phase 3). This mirrors
  the existing `schema.ts` "MONEY IS DELIBERATELY ABSENT" convention.
- **The look is locked (Rule 2).** Backend only. `/dashboard/vault` already exists
  as a UI surface; we build behind it. Any visible change is asked first.
- **No fake data near prod (Rule 3).** Schema + migration land in the dev DB first;
  no seeded/mock vaults in any prod-reachable environment.

## 1. Principles

1. **Files exist once.** Bytes are written once and never duplicated on transfer.
2. **Transfer is an ownership event, not a copy.** Delivery re-points a DB row; the
   storage layer is untouched.
3. **Permission is the boundary, not the path.** Today object keys are
   `${uid}/…` and clients pass paths — that is the BOLA (SECURITY_AUDIT #2) and the
   forgeable-purchase surface (#1). Vaults make **`can(user, vault, action)`** the
   single gate; storage keys carry **no identity**.
4. **Providers store bytes; GRID owns everything else** (ownership, permissions,
   visibility, accounting, lifecycle). The app never talks to a cloud SDK directly —
   only to a `StorageProvider`.
5. **Scale-ready, not scale-built.** We design so nothing *blocks* 10M users / 1B
   files / multi-region (opaque keys, ledger accounting, an event outbox, stateless
   logic). We do not stand up Kafka/k8s/multi-region today — that is an infra+cost
   decision for the owner (see §13).

## 2. The key insight: immutable, identity-free storage keys

```
Storage key = files/{fileId}          ← immutable. NO vaultId, NO uid in the key.
DB row      = file.vaultId            ← the ONLY thing that changes on transfer.
```

- A transfer sets `file.vaultId = contentVault.id`. **Zero storage operations.**
  This is literally "files exist once."
- The vault bucket is **service-role only** — no anon/publishable-key storage
  policy. The browser never addresses the bucket; it only ever receives a
  short-lived signed URL minted by the server *after* a `can()` check. This closes
  the path-guessing BOLA by construction.
- `StorageProvider.move()` exists only for rare cross-provider migration / rebalance
  — **never** for ownership transfer.

> Note: this corrects an earlier sketch that embedded `vaultId` in the key — that
> would force a storage copy on every delivery. `fileId`-keyed is what makes the
> no-copy guarantee real.

## 3. Domain model (Drizzle `pg-core`, matching existing conventions)

`text` ids (app-generated `vlt_`/`file_`/…), `user_id` TEXT → `user.id`, text-enum
columns with a comment (the codebase does not use `pgEnum`), `bigint` for bytes,
`$defaultFn` timestamps, explicit indexes. New tables: **`vault`, `file`,
`vault_permission`, `vault_invite`, `domain_event`** (+ `usage` extension).

```ts
// VaultType: 'personal' | 'project' | 'content' | 'team' | 'archive'
// status:    'active'   | 'archived'
export const vault = pgTable("vault", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  ownerId: text("owner_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  // Content vaults attach to the originating booking (final principle:
  // vaults are attached to projects/contracts/escrow).
  contractId: text("contract_id").references(() => contract.id, { onDelete: "set null" }),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
}, (t) => [
  index("vault_owner_id_idx").on(t.ownerId),
  index("vault_contract_id_idx").on(t.contractId),
]);

// status: 'uploading' | 'ready' | 'archived' | 'deleted' (soft delete preserves lineage)
export const file = pgTable("file", {
  id: text("id").primaryKey(),
  vaultId: text("vault_id").notNull().references(() => vault.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),          // `files/{id}` — immutable
  provider: text("provider").notNull().default("supabase"), // 'supabase'|'r2'|'s3' later
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull().default("application/octet-stream"),
  checksum: text("checksum"),                          // sha256 → dedup / lineage later
  size: bigint("size", { mode: "number" }).notNull().default(0),
  // Bytes survive the uploader's account deletion (client owns delivered assets).
  uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
  status: text("status").notNull().default("uploading"),
  replacesFileId: text("replaces_file_id"),            // version history (future)
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
}, (t) => [
  index("file_vault_id_idx").on(t.vaultId),
  index("file_checksum_idx").on(t.checksum),
]);

// Role: 'owner' | 'admin' | 'editor' | 'contributor' | 'viewer'
export const vaultPermission = pgTable("vault_permission", {
  id: text("id").primaryKey(),
  vaultId: text("vault_id").notNull().references(() => vault.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("viewer"),
  grantedBy: text("granted_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
}, (t) => [
  uniqueIndex("vperm_vault_user_uq").on(t.vaultId, t.userId),
  index("vperm_user_id_idx").on(t.userId),
]);

// status: 'pending' | 'accepted' | 'revoked' | 'expired'
export const vaultInvite = pgTable("vault_invite", {
  id: text("id").primaryKey(),
  vaultId: text("vault_id").notNull().references(() => vault.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull().default("viewer"),
  token: text("token").notNull().unique(),             // opaque; emailed (no email in URL)
  invitedBy: text("invited_by").notNull().references(() => user.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
}, (t) => [index("vinvite_vault_id_idx").on(t.vaultId), index("vinvite_token_idx").on(t.token)]);

// Append-only outbox. A worker reads unprocessed rows and fans out (§9).
export const domainEvent = pgTable("domain_event", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull(),
  processedAt: timestamp("processed_at"),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
}, (t) => [index("event_unprocessed_idx").on(t.processedAt)]);
```

**Vault types** — PERSONAL (owner-only drafts), PROJECT (active work; creator +
collaborators; client optional), **CONTENT** (auto-created on delivery; client =
OWNER, creator = retained access), TEAM (role-based; agencies/studios), ARCHIVE
(cold tier, §8).

## 4. Storage layer — `StorageProvider`

Formalizes the existing `src/lib/services/storage.service.ts` (already does signed
upload/download + remove against Supabase Storage). Decision (owner): **Supabase
Storage stays the impl behind the interface; no migration now.** R2/S3 become
drop-in later.

```ts
export interface StorageProvider {
  createSignedUploadUrl(key: string, opts): Promise<ServiceResult<{ url; token }>>;
  generateSignedUrl(key: string, expiresIn?: number): Promise<ServiceResult<{ url }>>; // download
  upload(key, body, opts): Promise<ServiceResult<{ key }>>;   // server-side
  getMetadata(key: string): Promise<ServiceResult<{ size; mimeType } | null>>;
  move(fromKey, toKey): Promise<ServiceResult<void>>;          // migration only — NOT transfer
  delete(key: string): Promise<ServiceResult<void>>;
}
```

`SupabaseStorageProvider` wraps the current functions; `keyFor()` changes from
`${uid}/${category}/…` to `files/${fileId}`. `ServiceResult<T>` is the existing
`ok/fail` type. Vault files use a **separate, service-role-only bucket** (the
current `uploads` bucket and its anon RLS policy stay for legacy paths during
migration, then retire).

## 5. Permission model — one `can()` chokepoint

```ts
type Action = "view" | "upload" | "download" | "delete" | "move" | "share" | "invite" | "archive";
async function can(userId: string, vaultId: string, action: Action): Promise<boolean>;
```

Role → action capability (least-privilege):

| Action | OWNER | ADMIN | EDITOR | CONTRIBUTOR | VIEWER |
|---|---|---|---|---|---|
| view / download | ✓ | ✓ | ✓ | ✓ | ✓ |
| upload | ✓ | ✓ | ✓ | ✓ | — |
| delete / move | ✓ | ✓ | ✓ | — | — |
| share / invite | ✓ | ✓ | — | — | — |
| archive | ✓ | ✓ | — | — | — |
| transfer ownership | ✓ | — | — | — | — |

- `can()` is the **single** authz gate, called on **every** vault action. This is
  the "right altitude" fix the review asked for — it replaces the scattered
  `where user_id = uid` checks and the client-supplied-path trust.
- **RLS interplay:** the app's Drizzle still bypasses RLS (server authz = `can()`).
  RLS on the new tables locks the browser/PostgREST surface to `using (exists a
  vault_permission row for auth.uid())`, restrictive, with `with check` on writes —
  and the vault bucket has **no** anon policy at all (service-role only). So a
  forged direct INSERT/upload (the #1/#2 class) can't unlock a vault.

## 6. Delivery & ownership transfer

```
1. Creator uploads → PROJECT vault (owner = creator).            [emit FileUploaded]
2. Client approves delivery.                                     [trigger]
3. Ensure CONTENT vault for the contract (owner = client).       [emit VaultCreated]
4. file.vaultId = contentVault.id   ← pointer move, NO byte copy [emit FileDelivered]
5. Grant creator CONTRIBUTOR (or EDITOR) on the content vault.   [emit PermissionGranted]
6. Quota follows ownership: −size creator ledger, +size client.  (§8)
```

- **Result:** client = OWNER, creator = retained access (CONTRIBUTOR/EDITOR). Bytes
  never moved.
- **Trigger is partly Phase 3.** In an escrow marketplace, ownership should pass on
  **payment/escrow release**, not a bare button. Phase B wires the trigger to an
  explicit client approval; Phase 3 (Stripe/escrow) re-points it at
  `escrow.released`. The *mechanics* are built now; the *trigger* hardens later.
- Atomicity: steps 3–6 run in one `db.transaction`; the event rows are written in
  the same tx (transactional outbox) so "delivered" and "event emitted" can't
  diverge.

## 7. Access retention & invitations

- **Retention:** the creator's row in `vault_permission` is *added* (CONTRIBUTOR),
  never the OWNER row — so losing ownership ≠ losing access.
- **Invites:** `Create invite → email (opaque token, no email in URL — mirrors the
  waitlist unsubscribe pattern) → accept → vault_permission row`. Expiry +
  single-use token. Inviter needs `share`/`invite` capability (`can()`).

## 8. Storage accounting (ledger) — NON-MONEY

Extend the existing `usage` table (today: `storageBytes`, `fileCount`) with
`transferBytes` and `archiveBytes`. The ledger is the source of truth (never trust
the frontend) and reuses the existing atomic `reserveStorage`/`releaseStorage`
pattern in `quota.ts`.

- On transfer, bytes move between owners' ledgers (§6 step 6).
- ARCHIVE bytes are tracked separately (cheaper tier, §13).
- **This measures bytes. It does NOT price them.** Overage, tiers, enterprise
  contracts = **Phase D (Rule 1)**. Open question: does a delivered asset count
  against the *client's* 50 GB cap? (see §15).

## 9. Events & async — honest version

There is no event bus today (only `after()`). We do **not** introduce Kafka/k8s.

- **Transactional outbox:** writes to `domain_event` happen in the same tx as the
  state change. Events: `FileUploaded, FileDelivered, VaultCreated, PermissionGranted,
  PermissionRevoked, FileArchived, StorageQuotaExceeded`.
- **Processor:** a worker drains unprocessed rows. On Vercel today that is a cron
  route (or Supabase `pg_cron`/`pgmq`, or Upstash QStash) — swappable behind a
  small `EventBus` interface. Heavy jobs (virus scan, thumbnails, AI indexing) are
  *consumers*, not inline work — so they never block a user request. This is the
  durable-queue upgrade over `after()`.

## 10. Audit logging

Reuse the existing append-only `audit_event` table (immutable; `user_id`→null on
account deletion). Add the storage actions: `UPLOAD, DOWNLOAD, DELETE, MOVE,
TRANSFER, SHARE, INVITE, PERMISSION_CHANGE, ARCHIVE`. Audit = compliance record;
`domain_event` = automation trigger. They are separate on purpose.

## 11. Security model

Private by default · no public URLs · downloads only via signed URLs (default
**5 min** for vault deliverables; the current 60 min default drops) · every action
behind `can()` · vault bucket service-role-only · opaque immutable keys · checksum
on upload (integrity + future dedup). **Directly resolves SECURITY_AUDIT #1
(forgeable entitlement rows) and #2 (path-guessing BOLA).**

## 12. Migration (Rule 3 — dev first)

Existing `product.filePath` and `portfolio_item.imagePath` are pre-vault files.
Plan: backfill a PERSONAL/CONTENT vault per owner → insert `file` rows pointing at
the existing object keys (no byte move; `provider='supabase'`, legacy key shape
tolerated) → dual-read in the download paths → cut over → retire the old anon
storage policy. Reversible, batched, validated headless against the dev DB, test
rows cleaned up. No prod data touched until verified.

## 13. Scale story (what we build vs what the owner provisions)

| Spec target | Built into the model now | Needs owner infra/cost decision |
|---|---|---|
| 1B+ files, PB storage | opaque keys, ledger, no per-user path coupling | object-store tier/lifecycle config |
| Multi-region storage | `provider` column, provider interface | R2/S3 multi-region buckets |
| Multi-region DB | stateless `can()`, outbox | Supabase/Postgres read replicas (enterprise) |
| Event-driven | transactional outbox + EventBus iface | QStash/pgmq/Kafka choice |
| Background workers | events are consumers | a worker host (cron → ECS/k8s later) |
| Horizontal scaling | stateless request logic | **the rate-limiter + cache are in-memory per-instance today → wire Upstash (already a known gap) before multi-instance** |

## 14. Future requirements — nothing blocks them

AI search / face / object detection → consumers of `FileUploaded` writing to an
index table or pgvector. Duplicate detection → `checksum`. Versioning →
`replacesFileId`. Lineage → events + immutable keys. Licensing / rights / expiry →
new tables hanging off `file`/`vault` (lifecycle fields reserved). Enterprise
compliance → audit log + RLS already in place. None require schema we'd regret.

## 15. Open decisions (owner)

1. **Quota policy on delivery:** does a received asset count against the client's
   50 GB? (Likely needs a separate "owned content" allowance — touches future
   billing, Rule 1.)
2. **Signed-URL TTL** for vault downloads — 5 min per spec (vs current 60 min)?
3. **Team vaults / seats** — agency model: how do team seats map to subscription
   tiers? (Phase 3 money-adjacent.)
4. **Event processor host** — cron route to start, or Supabase pgmq / Upstash QStash?
5. **Transfer trigger** — confirm Phase B uses explicit client approval, Phase 3
   moves it to escrow-release.

## 16. Phasing

- **Phase A (next, on sign-off):** schema (vault/file/vault_permission/vault_invite/
  domain_event + usage cols) in **dev DB** · `StorageProvider` interface + Supabase
  impl · `can()` · transactional-outbox write helper · audit hooks. Feature-flagged;
  existing flows untouched. Build gate: `tsc` + `build` + headless dev-DB verify.
- **Phase B:** delivery → content-vault transfer (trigger = client approval) ·
  invites · access retention · migrate product/portfolio files in.
- **Phase C:** event processor + durable async (scan/thumbnail off `after()`) ·
  archive tier · wire `/dashboard/vault` UI (ask first per Rule 2).
- **Phase D (gated on owner + Phase 3):** billing/overage/tiers · escrow-release
  trigger · enterprise/compliance.

## 17. Explicitly NOT in scope (now)

Billing/pricing/overage (Rule 1) · Stripe (Phase 3) · multi-region DB/storage
provisioning · Kafka/k8s/ECS · ML models (face/object) · any UI redesign (Rule 2).
