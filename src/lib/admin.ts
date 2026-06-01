/**
 * Admin identity — pure helper, safe to import anywhere (no "use server").
 *
 * The built-in demo account is always an admin so the control panel works on a
 * fresh deploy. Add more admins via the ADMIN_EMAILS env var (comma-separated).
 */

const DEMO_EMAIL = (process.env.DEMO_EMAIL ?? "joingrid@demo.com").toLowerCase();

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (e === DEMO_EMAIL) return true;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(e);
}
