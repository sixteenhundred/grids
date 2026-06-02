import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/security/auth-guard";
import { isAdminEmail } from "@/lib/admin";
import { getFlags, auditServer } from "@/lib/admin-actions";
import { AdminPanel } from "@/components/dashboard/admin-panel";

export default async function AdminPage() {
  const current = await getCurrentUser();
  if (!isAdminEmail(current?.email)) redirect("/dashboard");

  const [flags, audit] = await Promise.all([getFlags(), auditServer()]);
  return <AdminPanel initialFlags={flags} initialAudit={audit} />;
}
