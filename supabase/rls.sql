-- ============================================================================
-- GRID — Row Level Security
-- Apply:  DATABASE_URL=<direct conn> node scripts/apply-rls.mjs   (or psql -f)
--
-- The app accesses data via Drizzle as the `postgres` role, which BYPASSES RLS;
-- server-side authorization is enforced in code (requireUser + WHERE user_id =
-- uid). These policies lock the PostgREST surface reachable with the public
-- (publishable/anon) key and authenticated user JWTs, so a browser client can
-- only touch a user's OWN rows. user_id columns hold the auth uid as text →
-- compare to (auth.uid())::text. Idempotent.
-- ============================================================================

-- Reset API-role table grants to a known baseline (service_role/postgres keep theirs).
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;

-- Enable RLS on every table.
alter table public."user"             enable row level security;
alter table public.profile            enable row level security;
alter table public.shop               enable row level security;
alter table public.product            enable row level security;
alter table public.purchase           enable row level security;
alter table public.academy            enable row level security;
alter table public.academy_enrollment enable row level security;
alter table public.learning_path      enable row level security;
alter table public.lesson             enable row level security;
alter table public.lesson_progress    enable row level security;
alter table public.feature_flag       enable row level security;
alter table public.waitlist           enable row level security;
alter table public.app_config         enable row level security;
alter table public.subscription       enable row level security;
alter table public.usage              enable row level security;
alter table public.contract           enable row level security;
alter table public.contract_version   enable row level security;
alter table public.review             enable row level security;
alter table public.dispute            enable row level security;
alter table public.portfolio_item     enable row level security;
alter table public.creator_package    enable row level security;
alter table public.audit_event        enable row level security;
alter table public.consent            enable row level security;

-- ---- user (mirror of auth.users): read own row only; writes via trigger ----
grant select on public."user" to authenticated;
drop policy if exists user_select_own on public."user";
create policy user_select_own on public."user"
  for select to authenticated using (id = (auth.uid())::text);

-- ---- profile: private, owner only ----
grant select, insert, update, delete on public.profile to authenticated;
drop policy if exists profile_own on public.profile;
create policy profile_own on public.profile
  for all to authenticated
  using (user_id = (auth.uid())::text)
  with check (user_id = (auth.uid())::text);

-- ---- marketplace content: PUBLIC read, OWNER write ----
-- shop
grant select on public.shop to anon, authenticated;
grant insert, update, delete on public.shop to authenticated;
drop policy if exists shop_read on public.shop;
create policy shop_read on public.shop for select using (true);
drop policy if exists shop_write on public.shop;
create policy shop_write on public.shop for all to authenticated
  using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);
-- product
grant select on public.product to anon, authenticated;
grant insert, update, delete on public.product to authenticated;
drop policy if exists product_read on public.product;
create policy product_read on public.product for select using (true);
drop policy if exists product_write on public.product;
create policy product_write on public.product for all to authenticated
  using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);
-- academy
grant select on public.academy to anon, authenticated;
grant insert, update, delete on public.academy to authenticated;
drop policy if exists academy_read on public.academy;
create policy academy_read on public.academy for select using (true);
drop policy if exists academy_write on public.academy;
create policy academy_write on public.academy for all to authenticated
  using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);
-- learning_path
grant select on public.learning_path to anon, authenticated;
grant insert, update, delete on public.learning_path to authenticated;
drop policy if exists path_read on public.learning_path;
create policy path_read on public.learning_path for select using (true);
drop policy if exists path_write on public.learning_path;
create policy path_write on public.learning_path for all to authenticated
  using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);
-- lesson
grant select on public.lesson to anon, authenticated;
grant insert, update, delete on public.lesson to authenticated;
drop policy if exists lesson_read on public.lesson;
create policy lesson_read on public.lesson for select using (true);
drop policy if exists lesson_write on public.lesson;
create policy lesson_write on public.lesson for all to authenticated
  using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);

-- ---- private, owner only ----
-- purchase / academy_enrollment / lesson_progress are PROOF of payment/access:
-- the browser may READ its own rows but must NOT write them — only the server
-- (Drizzle/postgres, bypassing RLS) inserts them after a real purchase/enroll.
-- No write grant closes the forge-your-own-entitlement vector (SECURITY_AUDIT #1).
grant select on public.purchase to authenticated;
drop policy if exists purchase_own on public.purchase;
create policy purchase_own on public.purchase for select to authenticated
  using (user_id = (auth.uid())::text);
grant select on public.academy_enrollment to authenticated;
drop policy if exists enrollment_own on public.academy_enrollment;
create policy enrollment_own on public.academy_enrollment for select to authenticated
  using (user_id = (auth.uid())::text);
grant select on public.lesson_progress to authenticated;
drop policy if exists progress_own on public.lesson_progress;
create policy progress_own on public.lesson_progress for select to authenticated
  using (user_id = (auth.uid())::text);

-- ---- contracts / versions / reviews / disputes ----
-- contract: readable by either party; writable by the creator.
grant select, insert, update, delete on public.contract to authenticated;
drop policy if exists contract_party_read on public.contract;
create policy contract_party_read on public.contract for select to authenticated
  using (creator_id = (auth.uid())::text or client_id = (auth.uid())::text);
drop policy if exists contract_owner_write on public.contract;
create policy contract_owner_write on public.contract for all to authenticated
  using (creator_id = (auth.uid())::text) with check (creator_id = (auth.uid())::text);

-- contract_version: append-only history, readable by either party of the parent.
grant select, insert on public.contract_version to authenticated;
drop policy if exists cversion_party_read on public.contract_version;
create policy cversion_party_read on public.contract_version for select to authenticated
  using (exists (select 1 from public.contract c
                 where c.id = contract_version.contract_id
                   and (c.creator_id = (auth.uid())::text or c.client_id = (auth.uid())::text)));
drop policy if exists cversion_insert on public.contract_version;
create policy cversion_insert on public.contract_version for insert to authenticated
  with check (editor_id = (auth.uid())::text
              and exists (select 1 from public.contract c
                          where c.id = contract_version.contract_id
                            and (c.creator_id = (auth.uid())::text or c.client_id = (auth.uid())::text)));

-- review: PUBLIC read (shown on profiles), author-only write.
grant select on public.review to anon, authenticated;
grant insert, update, delete on public.review to authenticated;
drop policy if exists review_read on public.review;
create policy review_read on public.review for select using (true);
drop policy if exists review_write on public.review;
create policy review_write on public.review for all to authenticated
  using (author_id = (auth.uid())::text) with check (author_id = (auth.uid())::text);

-- dispute: visible to the opener and either party of the contract; opener writes.
grant select, insert, update, delete on public.dispute to authenticated;
drop policy if exists dispute_party_read on public.dispute;
create policy dispute_party_read on public.dispute for select to authenticated
  using (opened_by_id = (auth.uid())::text
         or exists (select 1 from public.contract c
                    where c.id = dispute.contract_id
                      and (c.creator_id = (auth.uid())::text or c.client_id = (auth.uid())::text)));
drop policy if exists dispute_owner_write on public.dispute;
create policy dispute_owner_write on public.dispute for all to authenticated
  using (opened_by_id = (auth.uid())::text) with check (opened_by_id = (auth.uid())::text);

-- ---- portfolio_item / creator_package: owner-only on the API surface ----
-- (Public marketplace exposure is mediated by server actions selecting only
--  public fields; the raw PostgREST surface stays owner-scoped.)
grant select, insert, update, delete on public.portfolio_item to authenticated;
drop policy if exists portfolio_own on public.portfolio_item;
create policy portfolio_own on public.portfolio_item for all to authenticated
  using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);
grant select, insert, update, delete on public.creator_package to authenticated;
drop policy if exists cpackage_own on public.creator_package;
create policy cpackage_own on public.creator_package for all to authenticated
  using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);

-- ---- consent: owner-only on the API surface ----
grant select, insert, update, delete on public.consent to authenticated;
drop policy if exists consent_own on public.consent;
create policy consent_own on public.consent for all to authenticated
  using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);

-- ---- server-only tables (no API access) ----
--   audit_event — append-only trail written by the server (data-rights, etc.)
-- RLS enabled + no policies + no anon/authenticated grants → fully denied on the
-- PostgREST surface. The server (Drizzle/postgres) bypasses RLS to read/write.
--   feature_flag  — admin actions
--   waitlist      — joinWaitlist action
--   app_config    — config-store / admin (launch flag, CMS copy)
--   subscription  — Stripe webhook (Phase 3) + entitlements reads
--   usage         — quota service
-- (Nothing to add — the revoke above already locks them to the API roles.)

-- ============================================================================
-- Vault system (see VAULT_ARCHITECTURE.md). The browser surface is READ-ONLY and
-- permission-scoped; EVERY vault write goes through a server action (Drizzle/
-- postgres bypasses RLS) gated by can(). There are deliberately NO insert/update/
-- delete grants here, so the forge-your-own-row class (purchase/enrollment,
-- SECURITY_AUDIT #1) cannot recur on vault data.
-- ============================================================================
alter table public.vault            enable row level security;
alter table public.file             enable row level security;
alter table public.vault_permission enable row level security;
alter table public.vault_invite     enable row level security;
alter table public.domain_event     enable row level security;

-- vault: a member (has a permission row) may READ the vault. No browser writes.
grant select on public.vault to authenticated;
drop policy if exists vault_member_read on public.vault;
create policy vault_member_read on public.vault for select to authenticated
  using (exists (select 1 from public.vault_permission vp
                 where vp.vault_id = vault.id and vp.user_id = (auth.uid())::text));

-- file: readable by members of the file's vault. No browser writes (bytes are
-- server-uploaded; downloads are server-minted signed URLs only).
grant select on public.file to authenticated;
drop policy if exists file_member_read on public.file;
create policy file_member_read on public.file for select to authenticated
  using (exists (select 1 from public.vault_permission vp
                 where vp.vault_id = file.vault_id and vp.user_id = (auth.uid())::text));

-- vault_permission: a user may READ only their OWN grants. Granting/revoking is
-- server-side (can('share'/'invite')); NO insert grant → nobody can grant
-- themselves a role on another user's vault.
grant select on public.vault_permission to authenticated;
drop policy if exists vperm_own_read on public.vault_permission;
create policy vperm_own_read on public.vault_permission for select to authenticated
  using (user_id = (auth.uid())::text);

-- vault_invite, domain_event: server-only (RLS on, no grants, no policy → fully
-- denied on the PostgREST surface). Invite accept runs through a tokened server
-- action; events are drained by the worker. The top-of-file revoke locks them.
