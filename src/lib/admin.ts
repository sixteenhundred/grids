/**
 * Admin identity — pure helper, safe to import anywhere (no "use server").
 *
 * Admins are configured ONLY via env and FAIL CLOSED (no env → no admins).
 * There is deliberately NO hardcoded admin email: a self-registerable address
 * must never grant admin (that was an account-takeover hole). Put a real,
 * already-registered address you control in ADMIN_EMAILS (prod) / DEMO_EMAIL
 * (local). Synthetic anonymous emails (`*@grid.local`) are always rejected, so a
 * guest/anonymous session can never be admin.
 */

function adminSet(): Set<string> {
  const raw = `${process.env.ADMIN_EMAILS ?? ""},${process.env.DEMO_EMAIL ?? ""}`;
  return new Set(raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (!e || e.endsWith("@grid.local")) return false; // never anonymous/synthetic identities
  return adminSet().has(e);
}
