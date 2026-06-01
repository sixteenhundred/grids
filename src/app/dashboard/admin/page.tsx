import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { hasDemoSession } from "@/lib/demo-auth";
import { DEMO_USER } from "@/lib/demo";
import { isAdminEmail } from "@/lib/admin";
import { getFlags, auditServer } from "@/lib/admin-actions";
import { AdminPanel } from "@/components/dashboard/admin-panel";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const email = session?.user?.email ?? ((await hasDemoSession()) ? DEMO_USER.email : null);
  if (!isAdminEmail(email)) redirect("/dashboard");

  const [flags, audit] = await Promise.all([getFlags(), auditServer()]);
  return <AdminPanel initialFlags={flags} initialAudit={audit} />;
}
