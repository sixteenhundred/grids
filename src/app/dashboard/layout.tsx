import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasDemoSession } from "@/lib/demo-auth";
import { DEMO_USER } from "@/lib/demo";
import { isAdminEmail } from "@/lib/admin";
import { getFlags } from "@/lib/admin-actions";
import { RoleProvider } from "@/components/dashboard/role-context";
import { SheetProvider } from "@/components/dashboard/sheet";
import { DashboardShell } from "@/components/dashboard/shell";

// Set NEXT_PUBLIC_DEMO_MODE=1 to open the whole app with no login at all.
const OPEN_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

// Campaign's live web research (Claude + web_search) can run 20-40s — give
// server actions on dashboard routes room before the platform times them out.
// (Vercel Hobby caps at 60s; raise on Pro if needed.)
export const maxDuration = 60;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Tolerate a missing database (getSession can throw) so the app still loads.
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const demo = await hasDemoSession();

  if (!session && !demo && !OPEN_DEMO) {
    redirect("/login");
  }

  const user = session?.user ?? DEMO_USER;
  const isAdmin = isAdminEmail(user.email);
  const flags = await getFlags();

  return (
    <RoleProvider>
      <SheetProvider>
        <DashboardShell user={{ name: user.name, email: user.email }} isAdmin={isAdmin} flags={flags}>
          {children}
        </DashboardShell>
      </SheetProvider>
    </RoleProvider>
  );
}
