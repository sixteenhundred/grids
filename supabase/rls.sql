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
-- purchase
grant select, insert, update, delete on public.purchase to authenticated;
drop policy if exists purchase_own on public.purchase;
create policy purchase_own on public.purchase for all to authenticated
  using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);
-- academy_enrollment
grant select, insert, update, delete on public.academy_enrollment to authenticated;
drop policy if exists enrollment_own on public.academy_enrollment;
create policy enrollment_own on public.academy_enrollment for all to authenticated
  using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);
-- lesson_progress
grant select, insert, update, delete on public.lesson_progress to authenticated;
drop policy if exists progress_own on public.lesson_progress;
create policy progress_own on public.lesson_progress for all to authenticated
  using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);

-- ---- server-only tables (no API access) ----
-- RLS enabled + no policies + no anon/authenticated grants → fully denied on the
-- PostgREST surface. The server (Drizzle/postgres) bypasses RLS to read/write.
--   feature_flag  — admin actions
--   waitlist      — joinWaitlist action
--   app_config    — config-store / admin (launch flag, CMS copy)
--   subscription  — Stripe webhook (Phase 3) + entitlements reads
--   usage         — quota service
-- (Nothing to add — the revoke above already locks them to the API roles.)
